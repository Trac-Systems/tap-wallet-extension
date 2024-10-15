import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {useEffect, useState} from 'react';

export function RBFBar({
  defaultValue,
  onChange,
}: {
  defaultValue?: boolean;
  onChange: (val: boolean) => void;
}) {
  const [enableRBF, setEnableRBF] = useState(defaultValue || false);

  useEffect(() => {
    onChange(enableRBF);
  }, [enableRBF]);

  return (
    <UX.Box layout="row_between" style={{marginTop: '14px'}}>
      <UX.Box spacing="xss" layout="row">
        <UX.Text title="RBF" styleType="body_14_bold" />
        <UX.Tooltip text="A feature allows the transaction to be replaced.">
          <SVG.QuestionMark />
        </UX.Tooltip>
      </UX.Box>
      <UX.CheckBox
        onChange={() => {
          setEnableRBF(!enableRBF);
        }}
        checked={enableRBF}
      />
    </UX.Box>
  );
}
