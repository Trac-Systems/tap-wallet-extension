import {UX} from '@/src/ui/component';
import React from 'react';

type TagStatus = 'Unconfirmed' | 'Confirmed' | 'Pending' | 'Tapped';

interface TagProps {
  text: TagStatus;
}

const tagStyles: Record<TagStatus, React.CSSProperties> = {
  Unconfirmed: {
    background: '#545454',
  },
  Confirmed: {
    background: '#0AC285',
  },
  Pending: {
    background: '#F4C242',
  },
  Tapped: {
    background:
      'linear-gradient(180deg, #F79E6D 0%, #EA5B64 50%, #C54359 100%)',
  },
};

export const Tags: React.FC<TagProps> = ({text}) => {
  return (
    <UX.Text
      title={text}
      styleType="body_12_normal"
      customStyles={{
        ...tagStyles[text],
        padding: '1px 8px',
        borderRadius: 24,
        width: 'fit-content',
        marginLeft: '16px',
      }}
    />
  );
};
