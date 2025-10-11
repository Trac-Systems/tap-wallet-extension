import React from 'react';
import {UX} from '../index';
import {SVG} from '../../svg';
import {colors} from '../../themes/color';

interface PasswordUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdatePassword: () => void;
}

const PasswordUpdateModal: React.FC<PasswordUpdateModalProps> = ({
  visible,
  onClose,
  onUpdatePassword,
}) => {
  
  return (
    <UX.CustomModal 
      isOpen={visible} 
      onClose={() => {}}
      containerStyle={{
        backgroundColor: '#1A1A1A',
        borderRadius: '16px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        maxWidth: '453px',
        width: '90%'
      }}
    >
      <UX.Box
        layout="column"
        spacing="xl">
        {/* Title */}
        <UX.Text
          title="Update your password"
          styleType="heading_24"
          customStyles={{
            color: '#FFF',
            textAlign: 'center',
            fontFamily: 'Exo',
            fontSize: '24px',
            fontStyle: 'normal',
            fontWeight: '600',
            lineHeight: '32px',
          }}
        />

        {/* Content Container */}
        <UX.Box layout="column" style={{marginBottom: '16px'}}>
          <div
            style={{
              color: '#B0B0B0',
              fontFamily: 'Exo',
              fontSize: '16px',
              fontStyle: 'normal',
              fontWeight: '400',
              lineHeight: '22px',
              textAlign: 'left',
            }}>
            We are switching to passwords for better security.{' '}
            <span style={{color: '#FFF', fontWeight: 'bold'}}>4-digit PIN</span> are no longer secure enough.
          </div>

          <div
            style={{
              color: '#B0B0B0',
              fontFamily: 'Exo',
              fontSize: '16px',
              fontStyle: 'normal',
              fontWeight: '400',
              lineHeight: '22px',
              textAlign: 'left',
            }}>
            Please update your password to a minimum of{' '}
            <span style={{color: '#FFF', fontWeight: 'bold'}}>12 characters</span> to continue accessing your wallets.
          </div>
        </UX.Box>

        {/* Update Button */}
        <UX.Button
          styleType="primary"
          onClick={onUpdatePassword}
          title="Update Password"
        />
      </UX.Box>
    </UX.CustomModal>
  );
};

export default PasswordUpdateModal;
