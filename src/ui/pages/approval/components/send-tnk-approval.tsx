import { UX } from '@/src/ui/component/index';
import { colors } from '@/src/ui/themes/color';
import { SVG } from '@/src/ui/svg';
import { useState, useEffect } from 'react';
import { useCustomToast } from '@/src/ui/component/toast-custom';
import { useAppSelector } from '@/src/ui/utils';
import { GlobalSelector } from '@/src/ui/redux/reducer/global/selector';
import { useWalletProvider } from '@/src/ui/gateway/wallet-provider';
import { TracApiService } from '@/src/background/service/trac-api.service';
import { TracApi } from '@/src/background/requests/trac-api';
import { Network } from '@/src/wallet-instance';
import { useApproval } from '../hook';
import LayoutApprove from '../layouts';
import WebsiteBar from '@/src/ui/component/website-bar';

interface SendTNKParams {
    from: string;
    to: string;
    amount: string;
}

interface Props {
    params: {
        session: {
            origin: string;
            icon: string;
            name: string;
        };
        data: SendTNKParams;
    };
}

export default function SendTNKApproval({ params: { session, data } }: Props) {
    const [, resolveApproval, rejectApproval] = useApproval();
    const wallet = useWalletProvider();
    const networkType = useAppSelector(GlobalSelector.networkType);
    const { showToast } = useCustomToast();

    const [loading, setLoading] = useState(false);
    const [fee, setFee] = useState<string>('0');
    const [txData, setTxData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!data || typeof data.from !== 'string' || typeof data.to !== 'string' || !data.amount) {
            setError(`Invalid transaction data received. Data: ${JSON.stringify(data)}`);
            return;
        }
        prepareTransaction();
    }, []);

    const prepareTransaction = async () => {
        try {
            setError(null); // Clear previous errors

            const tracCrypto = TracApiService.getTracCryptoInstance();
            if (!tracCrypto) {
                throw new Error('TracCryptoApi not available');
            }

            // Validate address
            const validation = TracApiService.validateTracAddress(data.to);
            if (!validation.valid) {
                throw new Error(validation.error || 'Invalid recipient address');
            }

            // Convert amount to hex
            const amountHex = TracApiService.amountToHex(data.amount);

            // Fetch validity (txv) from TRAC network – must be a 32-byte hex string
            const validityHex = await TracApi.fetchTransactionValidity(networkType);

            const chainId = networkType === Network.MAINNET
                ? tracCrypto.MAINNET_ID
                : tracCrypto.TESTNET_ID;

            // Pre-build transaction to get fee
            const preBuildData = await TracApiService.preBuildTransaction({
                from: data.from,
                to: data.to,
                amountHex,
                validityHex,
            }, chainId);

            setTxData({
                ...preBuildData,
                amountHex,
                validityHex,
                chainId,
            });

            // Fetch fee from API (same as send-trac.tsx)
            try {
                const feeHex = await TracApi.fetchTransactionFee(networkType);
                const feeDisplay = TracApiService.balanceToDisplay(feeHex);
                setFee(parseFloat(feeDisplay).toFixed(8));
            } catch (feeError) {
                console.warn('Failed to fetch fee from API, using preBuildData fee:', feeError);
                // Fallback to preBuildData fee if API fails
                if (preBuildData?.fee) {
                    const feeDisplay = TracApiService.balanceToDisplay(preBuildData.fee);
                    setFee(parseFloat(feeDisplay).toFixed(8));
                }
            }
        } catch (error: any) {
            console.error('Error preparing transaction:', error);
            setError(error?.message || 'Failed to prepare transaction');
            // Don't reject here - let user see the error and decide
        }
    };

    const handleCancel = () => {
        rejectApproval('User rejected the transaction.');
    };

    const handleConfirm = async () => {
        if (!txData) {
            showToast({ title: 'Transaction data not ready', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const activeWallet = await wallet.getActiveWallet();

            let walletIndex: number;
            let accountIndex: number;

            const indices = await wallet.getIndicesByTracAddress(data.from);

            if (indices) {
                walletIndex = indices.walletIndex;
                accountIndex = indices.accountIndex;
            } else {
                walletIndex = activeWallet?.index ?? 0;
                accountIndex = activeWallet?.accounts?.[0]?.index ?? 0;
            }

            let secret: Buffer;
            try {
                const tracPrivateKey = await wallet.getTracPrivateKeyUnlocked(
                    walletIndex,
                    accountIndex,
                );
                secret = Buffer.from(tracPrivateKey, 'hex');
            } catch (e: any) {
                const mnemonicData = await wallet.getMnemonicsUnlocked(activeWallet);
                const generated = await TracApiService.generateKeypairFromMnemonic(
                    mnemonicData.mnemonic,
                    accountIndex,
                );
                secret = TracApiService.toSecretBuffer(generated.secretKey);
            }

            const txPayload = TracApiService.buildTransaction(txData, secret);
            const result = await TracApi.broadcastTransaction(txPayload, networkType);

            if (result.success) {
                const txHash = result.txid || TracApiService.decodePayload(txPayload);
                showToast({ title: 'Transaction sent successfully', type: 'success' });
                resolveApproval({ txHash, success: true });
            } else {
                throw new Error(result.error || 'Transaction failed');
            }
        } catch (err: any) {
            showToast({ title: err?.message || 'Failed to send transaction', type: 'error' });
            rejectApproval(err?.message || 'Failed to send transaction');
        } finally {
            setLoading(false);
        }
    };

    const formatAddressLongText = (address: string, start: number, end: number) => {
        if (!address || typeof address !== 'string') return '';
        if (address.length <= start + end) return address;
        return `${address.slice(0, start)}...${address.slice(-end)}`;
    };

    return (
        <LayoutApprove
            header={<WebsiteBar session={session} />}
            body={
                <UX.Box layout="column" spacing="xl" style={{ width: '100%' }}>
                    <UX.Box layout="column_center">
                        <UX.Box
                            style={{
                                padding: '18px',
                                borderRadius: '100%',
                                background: colors.red_100,
                                width: 'fit-content',
                            }}>
                            <SVG.ArrowUpRight />
                        </UX.Box>
                        <UX.Text
                            title="Send TNK"
                            styleType="body_16_normal"
                            customStyles={{ marginTop: '24px', marginBottom: '8px' }}
                        />
                        <UX.Text
                            title={`${data.amount} TNK`}
                            styleType="heading_24"
                            customStyles={{ textAlign: 'center' }}
                        />
                    </UX.Box>

                    <UX.Box layout="box" spacing="xl">
                        <UX.Box layout="row_between">
                            <UX.Text title="From" styleType="body_14_normal" />
                            <UX.Text
                                title={formatAddressLongText(data.from, 8, 6)}
                                styleType="body_14_normal"
                                customStyles={{ color: 'white' }}
                            />
                        </UX.Box>
                        <UX.Box layout="row_between">
                            <UX.Text title="To" styleType="body_14_normal" />
                            <UX.Text
                                title={formatAddressLongText(data.to, 8, 6)}
                                styleType="body_14_normal"
                                customStyles={{ color: 'white' }}
                            />
                        </UX.Box>
                    </UX.Box>

                    <UX.Box layout="box" spacing="xl">
                        <UX.Box layout="row_between">
                            <UX.Text title="Network fee" styleType="body_14_normal" />
                            <UX.Text
                                title={`${fee} TNK`}
                                styleType="body_14_normal"
                                customStyles={{ color: 'white' }}
                            />
                        </UX.Box>
                    </UX.Box>

                    {error && (
                        <UX.Box
                            style={{
                                padding: '12px',
                                borderRadius: '8px',
                                background: colors.red_100,
                            }}>
                            <UX.Text
                                title="Error"
                                styleType="body_14_bold"
                                customStyles={{ color: '#FF6B6B', marginBottom: '4px' }}
                            />
                            <UX.Text
                                title={error}
                                styleType="body_12_normal"
                                customStyles={{ color: '#FF6B6B' }}
                            />
                        </UX.Box>
                    )}
                </UX.Box>
            }
            footer={
                <UX.Box layout="row" spacing="sm">
                    <UX.Button
                        title="Cancel"
                        styleType="dark"
                        customStyles={{ flex: 1 }}
                        onClick={handleCancel}
                        isDisable={loading}
                    />
                    <UX.Button
                        title={loading ? 'Sending...' : 'Confirm'}
                        styleType="primary"
                        customStyles={{ flex: 1 }}
                        onClick={handleConfirm}
                        isDisable={loading || !txData || !!error}
                    />
                </UX.Box>
            }
        />
    );
}
