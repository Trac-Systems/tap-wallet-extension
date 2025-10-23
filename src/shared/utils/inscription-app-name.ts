import { IWalletProvider } from "@/src/ui/gateway/wallet-provider";

interface InscriptionName {
  id: string;
  appName: string;
}

export const getInscriptionName = async (
  wallet: IWalletProvider, 
  id: string
): Promise<InscriptionName | undefined> => {
  try {
    const content = await wallet.getInscriptionContent(id);
    if (!content || !content.dta) return undefined;
      
    const dta = JSON.parse(content.dta);
    return { id: id, appName: dta.appName };
  } catch (e) {
    console.error("Error fetching inscription content:", e);
    return undefined;
  }
};