import React, { CSSProperties, FC } from 'react';
import { colors } from '../../themes/color';
import {useOptionalI18n} from '../../i18n/context';
import type {TranslationParams} from '../../i18n/types';

export type BadgeProps = {
    text?: string;
    textKey?: string;
    textParams?: TranslationParams;
    className?: string;
    customStyles?: CSSProperties;
    status: 'default' | 'success' | 'warning' | 'error';
};

const Badge: FC<BadgeProps> = ({
    text,
    textKey,
    textParams,
    className,
    customStyles,
    status = 'default',
}) => {
    const i18n = useOptionalI18n();
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
            break;
        default:
            badgeStyles = {
                backgroundColor: colors.gray,
                color: colors.white
            }
            break;
    }


    return (
        <div className={className} style={{ borderRadius: '24px', padding: '1px 8px', textAlign: 'center', width: 'fit-content', font: '12px', lineHeight: '18px', ...badgeStyles, ...customStyles }}>
            {textKey && i18n ? i18n.t(textKey, textParams) : text}
        </div>
    );
};

export default Badge;
