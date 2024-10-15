import {formatNumberValue} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {colors} from '@/src/ui/themes/color';
import {CSSProperties, useEffect, useState} from 'react';

enum FeeRateType {
  CURRENT,
  CUSTOM,
}

export function OutputValueBar({
  defaultValue,
  minValue,
  onChange,
}: {
  defaultValue: number;
  minValue: number;
  onChange: (val: number) => void;
}) {
  //! State
  const options = [
    {
      title: 'Current',
      value: defaultValue,
    },
    {
      title: 'Custom',
    },
  ];
  const [optionIndex, setOptionIndex] = useState(FeeRateType.CURRENT);
  const [inputVal, setInputVal] = useState('');
  const {showToast} = useCustomToast();

  //! Function
  useEffect(() => {
    let val: any = defaultValue;
    if (optionIndex === FeeRateType.CUSTOM) {
      if (!inputVal) {
        onChange(0);
        return;
      }
      val = parseInt(inputVal, 10);
    } else if (options.length > 0) {
      val = options[optionIndex].value;
    }
    if (val + '' !== inputVal) {
      setInputVal(val);
    }
    onChange(val);
  }, [optionIndex, inputVal]);

  //! Render
  return (
    <UX.Box spacing="xs">
      <UX.Box layout="row" spacing="xs">
        {options.map((v, index) => {
          const selected = index === optionIndex;
          return (
            <UX.Box
              layout="column_center"
              key={v.title}
              onClick={() => {
                if (defaultValue < minValue && index === 0) {
                  showToast({
                    type: 'error',
                    title: 'Cannot change fee rate to a lower value',
                  });
                  return;
                }
                setOptionIndex(index);
              }}
              style={Object.assign({}, {
                height: 55,
                width: 120,
                padding: 8,
                borderRadius: 10,
                cursor: 'pointer',
                background: selected ? colors.redC54359 : colors.greyRgba42,
                border: `1px solid ${selected ? colors.white : colors.black}`,
              } as CSSProperties)}>
              <UX.Text
                title={v.title}
                styleType="body_16_normal"
                customStyles={{textAlign: 'center', color: colors.white}}
              />
              {v.value && (
                <UX.Text
                  title={`${v.value} sats`}
                  styleType="body_16_normal"
                  customStyles={{textAlign: 'center', color: colors.white}}
                />
              )}
            </UX.Box>
          );
        })}
      </UX.Box>
      {optionIndex === FeeRateType.CUSTOM && (
        <UX.AmountInput
          disableDecimal
          style={{fontSize: '14px', lineHeight: '22px'}}
          placeholder={'sats'}
          value={formatNumberValue(inputVal)}
          disableCoinSvg
          onAmountInputChange={val => {
            const cleanText = val.replace(/[^0-9.]/g, '');
            setInputVal(cleanText);
          }}
          autoFocus={true}
        />
      )}
    </UX.Box>
  );
}
