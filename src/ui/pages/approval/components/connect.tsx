import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {IDisplayAccount} from '@/src/wallet-instance';
import {shortAddress} from '@/src/ui/helper';
import {useAppDispatch, useAppSelector} from '@/src/ui/utils';
import WebsiteBar from '@/src/ui/component/website-bar';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {WalletActions} from '@/src/ui/redux/reducer/wallet/slice';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';
import {useApproval} from '../hook';
import LayoutApprove from '../layouts';

interface AccountItemProps {
  account?: IDisplayAccount;
  selected?: boolean;
  onClick?: () => void;
}

export function AccountItem(
  {account, selected, onClick}: AccountItemProps,
  ref,
) {
  if (!account) {
    return <div />;
  }

  return (
    <UX.Box layout="box_border" onClick={onClick}>
      <UX.Box layout="row" spacing="sm">
        <UX.Box style={{width: '20px'}}>{selected && <SVG.CheckIcon />}</UX.Box>
        <UX.Box spacing="xs">
          <UX.Text
            title={account.name}
            styleType="body_14_bold"
            customStyles={{color: 'white'}}
          />
          <UX.Text
            title={`${shortAddress(account.address)}`}
            styleType="body_12_bold"
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

export default function Connect({params: {session}}: Props) {
  const [, resolveApproval, rejectApproval] = useApproval();

  const handleCancel = () => {
    rejectApproval('User rejected the request.');
  };

  const handleConnect = async () => {
    await resolveApproval();
  };

  const wallets = useAppSelector(WalletSelector.wallets);
  const walletProvider = useWalletProvider();

  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);

  const dispatch = useAppDispatch();

  return (
    <LayoutApprove
      header={<WebsiteBar session={session} />}
      body={
        <UX.Box spacing="sm" style={{flex: 1}}>
          <UX.Text
            title="Connect with Tap Wallet"
            customStyles={{textAlign: 'center', color: 'white'}}
            styleType="body_14_normal"
          />
          <UX.Text
            title="Select the account to use on this site"
            customStyles={{textAlign: 'center'}}
            styleType="body_14_normal"
          />
          <UX.Text
            title="Only connect with sites you trust."
            customStyles={{textAlign: 'center'}}
            styleType="body_14_normal"
          />

          <UX.Box style={{height: '50vh', overflowY: 'auto', width: '100%'}}>
            {wallets.map(wallet => (
              <>
                <UX.Text title={wallet.name} styleType="heading_14" customStyles={{
                  margin: '8px 0px'
                }}/>
                <UX.Box key={wallet.key} style={{width: '100%', gap: '10px'}}>
                  {wallet.accounts.map(account => (
                    <AccountItem
                      key={account.key}
                      account={account}
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
                  ))}
                </UX.Box>
              </>
            ))}
          </UX.Box>
        </UX.Box>
      }
      footer={
        <UX.Box layout="row" spacing="sm">
          <UX.Button
            title="Cancel"
            styleType="dark"
            customStyles={{flex: 1}}
            onClick={handleCancel}
          />
          <UX.Button
            title="Connect"
            styleType="primary"
            customStyles={{flex: 1}}
            onClick={handleConnect}
          />
        </UX.Box>
      }
    />
  );
}
