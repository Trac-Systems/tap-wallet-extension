import { useNavigate } from 'react-router-dom';
import { UX } from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import { colors } from '../../themes/color';
import { useAppSelector } from '../../utils';
import { InscriptionSelector } from '../../redux/reducer/inscription/selector';

const ManageAuthority = () => {
    const inscriptions = useAppSelector(InscriptionSelector.listInscription);
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <LayoutSendReceive
            header={<UX.TextHeader text="Manage Authority" onBackClick={handleGoBack} />}
            body={

                <UX.Box style={{ width: '100%', maxHeight: 'calc(100vh - 150px)', overflow: 'auto' }} spacing="xs" layout="grid_column_2">
                    {inscriptions.map((item, index) => {
                        return (
                            <UX.Box layout="box_border" key={index}>
                                <UX.Box layout="column" spacing="xs" style={{ width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor:'pointer' }}>
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
                                            title={`#${item.inscriptionNumber}`}
                                            styleType="body_16_normal"
                                        />
                                        <UX.Text
                                            title={`${item.outputValue} SATs`}
                                            styleType="body_16_normal"
                                            customStyles={{ color: colors.main_500 }}
                                        />
                                    </UX.Box>
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