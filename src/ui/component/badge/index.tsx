import React, { CSSProperties, FC } from 'react';
import { colors } from '../../themes/color';

export type BadgeProps = {
    text: string;
    className?: string;
    customStyles?: CSSProperties;
    status: 'default' | 'success' | 'warning' | 'error';
};

const Badge: FC<BadgeProps> = ({ text, className, customStyles, status = 'default' }) => {
    let badgeStyles: CSSProperties;
    switch (status) {
        case 'success':
            badgeStyles = {
                backgroundColor: colors.green_500,
                color: colors.white
            }
            break;
        case 'warning':
            badgeStyles = {
                backgroundColor: colors.yellow,
                color: colors.white
            }
            break;
        case 'error':
            badgeStyles = {
                backgroundColor: colors.yellow_500,
                color: colors.white
            }
        default:
            badgeStyles = {
                backgroundColor: colors.gray,
                color: colors.white
            }
            break;
    }


    return (
        <div className={className} style={{ borderRadius: '24px', padding: '1px 8px', textAlign: 'center', width: 'fit-content', font: '12px', lineHeight: '18px', ...badgeStyles, ...customStyles }}>
            {text}
        </div>
    );
};

export default Badge;