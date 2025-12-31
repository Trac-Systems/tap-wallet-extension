import {useEffect, useState} from 'react';
import LedgerSignModal from '.';
import {ledgerSignManager} from '../../utils/ledger-sign-manager';

const LedgerSignModalHost = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = ledgerSignManager.subscribe(setIsOpen);
    return unsubscribe;
  }, []);

  return <LedgerSignModal isOpen={isOpen} />;
};

export default LedgerSignModalHost;

