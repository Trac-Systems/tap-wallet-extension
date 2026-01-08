import { useEffect, useState } from 'react';
import { UX } from '@/src/ui/component';
import { SVG } from '@/src/ui/svg';
import { IDisplayAccount } from '@/src/wallet-instance';
import { shortAddress } from '@/src/ui/helper';
import { useAppDispatch, useAppSelector } from '@/src/ui/utils';
import WebsiteBar from '@/src/ui/component/website-bar';
import { WalletSelector } from '@/src/ui/redux/reducer/wallet/selector';
import { useWalletProvider } from '@/src/ui/gateway/wallet-provider';
import { AccountSelector } from '@/src/ui/redux/reducer/account/selector';
import { WalletActions } from '@/src/ui/redux/reducer/wallet/slice';
import { AccountActions } from '@/src/ui/redux/reducer/account/slice';
import { useApproval } from '../hook';
import LayoutApprove from '../layouts';

interface AccountItemProps {
    account?: IDisplayAccount;
    selected?: boolean;
    onClick?: () => void;
    tracAddress?: string;
}

export function AccountItem(
    { account, selected, onClick, tracAddress }: AccountItemProps,
    ref,
) {
    if (!account) {
        return <div />;
    }

    return (
        <UX.Box layout="box_border" onClick={onClick}>
            <UX.Box layout="row" spacing="sm">
                <UX.Box style={{ width: '20px' }}>{selected && <SVG.CheckIcon />}</UX.Box>
                <UX.Box spacing="xs">
                    <UX.Text
                        title={account.name}
                        styleType="body_14_bold"
                        customStyles={{ color: 'white' }}
                    />
                    <UX.Text
                        title={tracAddress ? `${shortAddress(tracAddress)}` : 'No TRAC address'}
                        styleType="body_12_bold"
                        customStyles={{ color: tracAddress ? undefined : '#888' }}
                    />
                </UX.Box>
            </UX.Box>
        </UX.Box>
    );
}

interface Props {
    params: {
        session: {
            origin: string;
            icon: string;
            name: string;
        };
    };
}

export default function TracConnect({ params: { session } }: Props) {
    const [, resolveApproval, rejectApproval] = useApproval();

    const handleCancel = async () => {
        // Remove TRAC connection permission when user rejects
        await walletProvider.removeTracConnection(session.origin);
        rejectApproval('User rejected the request.');
    };

    const handleConnect = async () => {
        const _wallet = await walletProvider.getActiveWallet();
        const _account = await walletProvider.getActiveAccount();
        const address = await walletProvider.getTracAddress(_wallet.index, _account.index ?? 0);
        resolveApproval(address);
    };

    const wallets = useAppSelector(WalletSelector.wallets);
    const walletProvider = useWalletProvider();

    const activeWallet = useAppSelector(WalletSelector.activeWallet);
    const activeAccount = useAppSelector(AccountSelector.activeAccount);

    const dispatch = useAppDispatch();

    const [tracAddressMap, setTracAddressMap] = useState<{
        [walletKey: string]: { [accountIndex: string]: string };
    }>({});

    useEffect(() => {
        let ignore = false;
        const fetchAllTracAddresses = async () => {
            const map: { [walletKey: string]: { [accountIndex: string]: string } } = {};

            for (const wallet of wallets) {
                if (typeof wallet.index === 'number') {
                    try {
                        const addresses = await walletProvider.getWalletTracAddresses(wallet.index);
                        map[wallet.key] = addresses || {};
                    } catch (error) {
                        map[wallet.key] = {};
                    }
                }
            }

            if (!ignore) {
                setTracAddressMap(map);
            }
        };

        fetchAllTracAddresses();
        return () => {
            ignore = true;
        };
    }, [wallets, walletProvider]);

    const deriveTracPath = (accountIndex?: number) => {
        const index = accountIndex ?? 0;
        return `m/918'/0'/0'/${index}'`;
    };

    return (
        <LayoutApprove
            header={<WebsiteBar session={session} />}
            body={
                <UX.Box spacing="sm" style={{ flex: 1 }}>
                    <UX.Text
                        title="Connect with TRAC Network"
                        customStyles={{ textAlign: 'center', color: 'white' }}
                        styleType="body_14_normal"
                    />
                    <UX.Text
                        title="Select the TRAC account to use on this site"
                        customStyles={{ textAlign: 'center' }}
                        styleType="body_14_normal"
                    />
                    <UX.Text
                        title="Only connect with sites you trust."
                        customStyles={{ textAlign: 'center' }}
                        styleType="body_14_normal"
                    />

                    <UX.Box style={{ height: '50vh', overflowY: 'auto', width: '100%' }}>
                        {wallets.map(wallet => {
                            const walletTracAddresses = tracAddressMap[wallet.key] || {};

                            return (
                                <>
                                    <UX.Text title={wallet.name} styleType="heading_14" customStyles={{
                                        margin: '8px 0px'
                                    }} />
                                    <UX.Box key={wallet.key} style={{ width: '100%', gap: '10px' }}>
                                        {wallet.accounts.map(account => {
                                            const accountIndexKey = String(account?.index ?? 0);
                                            const tracAddress = walletTracAddresses[accountIndexKey];

                                            return (
                                                <AccountItem
                                                    key={account.key}
                                                    account={account}
                                                    tracAddress={tracAddress}
                                                    selected={
                                                        activeWallet.key === wallet.key &&
                                                        activeAccount.address === account.address
                                                    }
                                                    onClick={async () => {
                                                        const accountIndex = account.index || 0;
                                                        await walletProvider.changeWallet(wallet, accountIndex);
                                                        dispatch(WalletActions.setActiveWallet(wallet));
                                                        const _activeAccount =
                                                            await walletProvider.getActiveAccount();
                                                        dispatch(
                                                            AccountActions.setActiveAccount(_activeAccount),
                                                        );
                                                    }}
                                                />
                                            );
                                        })}
                                    </UX.Box>
                                </>
                            );
                        })}
                    </UX.Box>
                </UX.Box>
            }
            footer={
                <UX.Box layout="row" spacing="sm">
                    <UX.Button
                        title="Cancel"
                        styleType="dark"
                        customStyles={{ flex: 1 }}
                        onClick={handleCancel}
                    />
                    <UX.Button
                        title="Connect"
                        styleType="primary"
                        customStyles={{ flex: 1 }}
                        onClick={handleConnect}
                    />
                </UX.Box>
            }
        />
    );
}
