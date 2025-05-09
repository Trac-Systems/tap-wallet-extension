import { useNavigate } from 'react-router-dom';
import { UX } from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import { colors } from '../../themes/color';
import { useAppSelector } from '../../utils';
import { InscriptionSelector } from '../../redux/reducer/inscription/selector';
import { useEffect, useState } from 'react';
import { useWalletProvider } from '../../gateway/wallet-provider';
import { AccountSelector } from '../../redux/reducer/account/selector';

const limit = 1;

const ManageAuthority = () => {
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 1,
    });
    const wallet = useWalletProvider();
    const activeAccount = useAppSelector(AccountSelector.activeAccount);
    const navigate = useNavigate();
    const [authorityList, setAuthorityList] = useState<any[]>([]);
    const [totalAuthority, setTotalAuthority] = useState(0);

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleGetListAuthority = async () => {
        try {
            const response = await wallet.getAuthorityList(activeAccount.address, (pagination.currentPage - 1) * pagination.pageSize, pagination.pageSize);
            console.log('response :>> ', response);
            setAuthorityList(response?.data || []);
            setTotalAuthority(response?.total || 0);
        } catch (error) {
            console.log('error :>> ', error);
        }
    }

    useEffect(() => {
        if (activeAccount.address) {
            handleGetListAuthority();
        }
    }, [pagination.currentPage, activeAccount])

    return (
        <LayoutSendReceive
            header={<UX.TextHeader text="Manage Authority" onBackClick={handleGoBack} />}
            body={
                <UX.Box style={{ width: '100%', maxHeight: 'calc(100vh - 150px)', overflow: 'auto' }} spacing="xs" layout="grid_column_2">
                    {authorityList.map((item, index) => {
                        console.log('item :>> ', item);
                        return (
                            <UX.Box layout="box_border" key={index}>
                                <UX.Box layout="column" spacing="xs" style={{ width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                                    <UX.InscriptionPreview
                                        key={item.inscriptionId}
                                        data={item}
                                        preset="medium"
                                        onClick={() =>
                                            navigate('/home/inscription-detail', {
                                                state: {
                                                    inscriptionId: item?.inscriptionId,
                                                    hash: location.hash.replace('#', ''),
                                                },
                                            })
                                        }
                                    />
                                    <UX.Box layout="column">
                                        <UX.Text
                                            title={`#${item.num}`}
                                            styleType="body_16_normal"
                                        />
                                        <UX.Text
                                            title={`${item.val} SATs`}
                                            styleType="body_16_normal"
                                            customStyles={{ color: colors.main_500 }}
                                        />
                                    </UX.Box>
                                </UX.Box>
                                <UX.Box layout="row_center">
                                    <UX.Pagination
                                        pagination={pagination}
                                        total={totalAuthority}
                                        onChange={pagination => {
                                            setPagination(pagination);
                                        }}
                                    />
                                </UX.Box>
                            </UX.Box>
                        );
                    })}
                </UX.Box>
            }
            footer={
                <UX.Box
                    layout="column"
                    spacing="xl"
                    style={{
                        padding: '10px 0',
                    }}>
                    <UX.Button
                        styleType="primary"
                        title={'Crate Authority'}
                        onClick={() =>
                            navigate('/create-authority', {
                                state: {
                                    type: 'create',
                                },
                            })
                        }
                    />
                </UX.Box>
            }
        />
    );
};

export default ManageAuthority;