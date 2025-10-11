import {IDisplayAccount} from '@/src/wallet-instance';
import React from 'react';
import {useNavigate} from 'react-router-dom';
import {SVG} from '../../svg';
import {colors} from '../../themes/color';
import {spaces} from '../../themes/space';
import {shortNameAccount} from '../../utils';
import {AddressBar} from '../address-bar';
import Box from '../box-custom';
import Text from '../text-custom';

interface AssetData {
  totalBtc: string;
  satoshis: number;
  totalInscription: number;
}

interface ICardAddressProps {
  isActive?: boolean;
  nameCardAddress: string;
  path?: string;
  address: string;
  onClick?: () => void;
  isAccount?: boolean;
  assets?: AssetData;
  item?: IDisplayAccount;
  hasVault?: boolean;
  assetUnit?: string;
  assetIcon?: React.ReactNode;
  hideCopy?: boolean;
}
const CardAddress = (props: ICardAddressProps) => {
  const {
    isActive,
    nameCardAddress,
    path,
    address,
    onClick,
    item,
    assets,
    isAccount,
    hasVault,
    hideCopy,
  } = props;
  const { assetUnit, assetIcon } = props;
  const navigate = useNavigate();

  return (
    <Box
      onClick={onClick}
      style={{
        backgroundColor: isActive ? colors.black_3 : colors.greyRgba42,
        border: '1px solid #545454',
        borderRadius: '10px',
        cursor: 'pointer',
        padding: spaces.xl,
      }}>
      <Box layout="row_between">
        <Box layout="row" spacing="sm">
          <Text
            title={shortNameAccount(nameCardAddress)}
            styleType="body_16_normal"
            customStyles={{color: 'white'}}
          />
          {isAccount ? (
            <Box
              onClick={(event?: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                navigate('/home/edit-account-name', {
                  state: item,
                });
              }}>
              <SVG.EditIcon />
            </Box>
          ) : null}
        </Box>
        {isActive ? <SVG.CheckIcon /> : null}
      </Box>
      <Box layout="row_between">
        <AddressBar address={address} hideCopy={hideCopy} />
        {path ? <Text title={path} styleType="body_14_bold" /> : null}
      </Box>
      {hasVault && (
        <Box
          layout="box_border"
          style={{marginTop: '10px', background: colors.black_2}}>
          <Box layout="row" spacing="sm">
            {assetIcon ?? <SVG.BitcoinIcon width={20} height={20} />}
            <Text
              title={`${assets?.totalBtc} ${assetUnit || 'BTC'}`}
              styleType="body_14_bold"
              customStyles={{color: colors.main_500}}
            />
          </Box>
          {assets?.totalInscription ? (
            <Text
              title={`${assets?.totalInscription} INSCRIPTIONS`}
              styleType="body_14_bold"
              customStyles={{color: colors.main_500}}
            />
          ) : null}
        </Box>
      )}
    </Box>
  );
};

export default CardAddress;
