import {useMemo, useState} from 'react';
import {getIsExtensionInTab, getUiType} from '../utils';
import '../../ui/styles/global.css';

export const AppDimensions = props => {
  const [extensionIsInTab, setExtensionIsInTab] = useState(false);
  const [isNotification] = useState(getUiType().isNotification);
  getIsExtensionInTab().then(isExt => setExtensionIsInTab(isExt));
  const classNameResponsive = useMemo(() => {
    if (isNotification) {
      return 'responsive-ext'
    } else {
      return extensionIsInTab ? 'responsive' : 'responsive-ext'
    }
  }, [extensionIsInTab, isNotification])

  return (
    <div
      className={classNameResponsive}
      {...props}
      style={{margin: 'auto'}}
    />
  );
};
