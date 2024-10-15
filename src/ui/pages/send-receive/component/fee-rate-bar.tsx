import {UX} from '@/src/ui/component';
import {colors} from '@/src/ui/themes/color';
import {CSSProperties, useEffect, useState} from 'react';
import {useWalletProvider} from '../../../gateway/wallet-provider';
import {isEmpty} from 'lodash';
import {formatNumberValue} from '@/src/shared/utils/btc-helper';

enum FeeRateType {
  SLOW,
  AVG,
  FAST,
  CUSTOM,
}

export function FeeRateBar({
  readonly,
  onChange,
}: {
  readonly?: boolean;
  onChange?: (val: number) => void;
}) {
  const wallet = useWalletProvider();

  const [feeOptions, setFeeOptions] = useState<
    {title: string; desc?: string; feeRate: number}[]
  >([]);

  const [feeOptionIndex, setFeeOptionIndex] = useState(FeeRateType.AVG);
  const [feeRateInputVal, setFeeRateInputVal] = useState('');
  useEffect(() => {
    wallet
      .getRecommendFee()
      .then(v => {
        const slowFee = {
          title: 'Slow',
          feeRate: v?.hourFee || 1,
          desc: '≈ 1 hour',
        };
        const avgFee = {
          title: 'Avg',
          feeRate: v?.halfHourFee || 2,
          desc: '≈ 30 mins',
        };
        const fastestFee = {
          title: 'Fast',
          feeRate: v?.fastestFee || 3,
          desc: '≈ 10 mins',
        };
        const updatedList = [slowFee, avgFee, fastestFee];

        if (readonly) {
          setFeeOptions(updatedList);
        } else {
          setFeeOptions([...updatedList, {title: 'Custom', feeRate: 0}]);
        }
      })
      .catch(() => {
        const slowFee = {
          title: 'Slow',
          feeRate: 1,
          desc: '≈ 1 hour',
        };
        const avgFee = {
          title: 'Avg',
          feeRate: 2,
          desc: '≈ 30 mins',
        };
        const fastestFee = {
          title: 'Fast',
          feeRate: 3,
          desc: '≈ 10 mins',
        };
        const updatedList = [slowFee, avgFee, fastestFee];

        if (readonly) {
          setFeeOptions(updatedList);
        } else {
          setFeeOptions([...updatedList, {title: 'Custom', feeRate: 0}]);
        }
      });
  }, []);

  useEffect(() => {
    const defaultOption = feeOptions[1];
    const defaultVal = defaultOption ? defaultOption.feeRate : 1;

    let val = defaultVal;
    if (feeOptionIndex === FeeRateType.CUSTOM) {
      val = parseInt(feeRateInputVal) || 0;
    } else if (feeOptions.length > 0) {
      val = feeOptions[feeOptionIndex].feeRate;
    }
    onChange?.(val);
  }, [feeOptions, feeOptionIndex, feeRateInputVal]);

  const adjustFeeRateInput = (inputVal: string) => {
    let val = parseInt(inputVal);
    if (!val) {
      setFeeRateInputVal('');
      return;
    }
    const defaultOption = feeOptions[1];
    const defaultVal = defaultOption ? defaultOption.feeRate : 1;
    if (val <= 0) {
      val = defaultVal;
    }
    setFeeRateInputVal(val.toString());
  };

  if (isEmpty(feeOptions)) {
    return <UX.Loading />;
  }
  return (
    <UX.Box style={{width: '100%'}}>
      <UX.Box layout="row_center" spacing="xss" style={{marginBottom: '10px'}}>
        {feeOptions.map((v, index) => {
          let selected = index === feeOptionIndex;
          if (readonly) {
            selected = false;
          }
          return (
            <UX.Box
              layout="column_center"
              key={v.title}
              onClick={() => {
                if (readonly) {
                  return;
                }
                setFeeOptionIndex(index);
              }}
              style={Object.assign({}, {
                border: `1px solid ${selected ? colors.white : colors.gray}`,
                width: '25%',
                height: 70,
                padding: 8,
                borderRadius: 10,
                cursor: 'pointer',
                background: selected ? colors.redC54359 : colors.greyRgba42,
              } as CSSProperties)}>
              <UX.Text
                styleType="body_12_bold"
                title={v.title}
                customStyles={{color: colors.white, textAlign: 'center'}}
              />
              {v.title !== 'Custom' && (
                <UX.Text
                  styleType="body_10_normal"
                  title={`${v.feeRate} sat/vB`}
                  customStyles={{color: colors.white, textAlign: 'center'}}
                />
              )}
              {v.title !== 'Custom' && (
                <UX.Text styleType="body_10_normal" title={`${v.desc}`} />
              )}
            </UX.Box>
          );
        })}
      </UX.Box>
      {feeOptionIndex === FeeRateType.CUSTOM && (
        <UX.Box spacing="xs">
          <UX.AmountInput
            placeholder={'sat/vB'}
            disableCoinSvg
            value={formatNumberValue(feeRateInputVal)}
            onAmountInputChange={amount => {
              if (amount.length > 10) {
                return;
              }
              const cleanText = amount.replace(/[^0-9.]/g, '');
              adjustFeeRateInput(cleanText);
            }}
            style={{fontSize: '14px', lineHeight: '22px'}}
            autoFocus={true}
          />
          {feeRateInputVal.length > 9 && (
            <UX.Text
              styleType="body_12_bold"
              customStyles={{color: colors.red_700}}
              title={'Not enough money to pay'}
            />
          )}
        </UX.Box>
      )}
    </UX.Box>
  );
}
