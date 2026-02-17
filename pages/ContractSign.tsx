import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SignaturePad from '../components/SignaturePad';

interface ContractData {
    id: string;
    client_name: string;
    type: string;
    event_date: string;
    value: number;
    status: string;
    filled_content: string;
    logo_url?: string;
    watermark_url?: string;
    signature_data?: string;
    signed_at?: string;
    user_id?: string;
}

const ContractSign: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [contract, setContract] = useState<ContractData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [signing, setSigning] = useState(false);
    const [signed, setSigned] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [adminSignature, setAdminSignature] = useState<string | null>(null);

    useEffect(() => {
        fetchContract();
    }, [token]);

    const fetchContract = async () => {
        if (!token) {
            setError('Token de acesso inválido');
            setLoading(false);
            return;
        }

        const { data, error: fetchError } = await supabase
            .from('contracts')
            .select('*')
            .eq('share_token', token)
            .single();

        if (fetchError || !data) {
            setError('Contrato não encontrado ou link expirado');
            setLoading(false);
            return;
        }

        setContract(data);

        if (data.status === 'signed') {
            setSigned(true);
        }

        // Fetch admin default signature if contract has user_id
        if (data.user_id) {
            await fetchAdminSignature(data.user_id);
        }

        setLoading(false);
    };

    const fetchAdminSignature = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('admin_signatures')
                .select('signature_data')
                .eq('user_id', userId)
                .eq('is_default', true)
                .single();

            if (!error && data) {
                setAdminSignature(data.signature_data);
            }
        } catch (error) {
            console.error('Error fetching admin signature:', error);
        }
    };

    const handleSignature = async (signatureData: string) => {
        if (!contract) return;

        setSigning(true);

        const { error: updateError } = await supabase
            .from('contracts')
            .update({
                signature_data: signatureData,
                signed_at: new Date().toISOString(),
                status: 'signed',
            })
            .eq('id', contract.id);

        if (updateError) {
            alert('Erro ao salvar assinatura. Tente novamente.');
            setSigning(false);
            return;
        }

        setSigned(true);
        setShowSignatureModal(false);
        setSigning(false);

        // Refresh contract data
        fetchContract();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const renderContractContent = () => {
        if (!contract) return '';
        let content = contract.filled_content || 'Conteúdo do contrato não disponível.';

        // Check for signature tags
        const hasClientSig = content.includes('[assinatura cliente]') || content.includes('[ASSINATURA CLIENTE]');
        const hasAdminSig = content.includes('[assinatura LOCATARIA]') || content.includes('[ASSINATURA LOCATARIA]');

        // If no signature tags or not signed, return plain content
        if (!hasClientSig && !hasAdminSig) {
            return content;
        }

        // Split content by signature tags
        const parts: (string | React.ReactNode)[] = [];
        let lastIndex = 0;

        // Regex to find all signature tags (case-insensitive)
        const tagRegex = /\[assinatura (cliente|CLIENTE|LOCATARIA|locataria)\]/gi;
        let match;

        while ((match = tagRegex.exec(content)) !== null) {
            // Add text before the tag
            if (match.index > lastIndex) {
                parts.push(content.substring(lastIndex, match.index));
            }

            const tagType = match[1].toUpperCase();

            if (tagType === 'CLIENTE') {
                if (signed && contract.signature_data) {
                    parts.push(
                        <div key={`sig-${match.index}`} className="inline-block mx-2 my-1 align-middle">
                            <img
                                src={contract.signature_data}
                                alt="Assinatura do Cliente"
                                className="max-h-16 border-b-2 border-slate-300"
                                style={{ display: 'inline-block', maxWidth: '200px' }}
                            />
                        </div>
                    );
                } else {
                    parts.push(
                        <span key={`sig-${match.index}`} className="inline-block mx-2 px-4 py-1 border-b-2 border-dashed border-slate-400 text-slate-500 italic text-sm">
                            [Aguardando Assinatura do Cliente]
                        </span>
                    );
                }
            } else if (tagType === 'LOCATARIA') {
                if (adminSignature) {
                    parts.push(
                        <div key={`sig-${match.index}`} className="inline-block mx-2 my-1 align-middle">
                            <img
                                src={adminSignature}
                                alt="Assinatura da Empresa"
                                className="max-h-16 border-b-2 border-slate-300"
                                style={{ display: 'inline-block', maxWidth: '200px' }}
                            />
                        </div>
                    );
                } else {
                    parts.push(
                        <span key={`sig-${match.index}`} className="inline-block mx-2 px-4 py-1 border-b-2 border-dashed border-slate-400 text-slate-500 italic text-sm">
                            [Assinatura da Empresa]
                        </span>
                    );
                }
            }

            lastIndex = match.index + match[0].length;
        }

        // Add remaining content
        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }

        return parts;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Carregando contrato...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl text-red-500">error</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Erro ao carregar</h1>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!contract) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {contract.logo_url && (
                            <img src={contract.logo_url} alt="Logo" className="h-10 object-contain" />
                        )}
                        <div>
                            <h1 className="font-bold text-slate-900">Contrato Digital</h1>
                            <p className="text-xs text-slate-500">{contract.type}</p>
                        </div>
                    </div>
                    {signed ? (
                        <span className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                            <span className="material-symbols-outlined text-lg">verified</span>
                            Assinado
                        </span>
                    ) : (
                        <button
                            onClick={() => setShowSignatureModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25"
                        >
                            <span className="material-symbols-outlined text-lg">draw</span>
                            Assinar Contrato
                        </button>
                    )}
                </div>
            </header>

            {/* Success Banner */}
            {signed && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-6">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-3xl text-white">check</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-emerald-800 text-lg">Contrato Assinado com Sucesso!</h2>
                            <p className="text-emerald-700 text-sm">
                                Assinado eletronicamente em {contract.signed_at && formatDate(contract.signed_at)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Contract Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Contract Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6">
                        <h2 className="text-2xl font-bold mb-2">{contract.type}</h2>
                        <div className="flex flex-wrap gap-4 text-purple-100 text-sm">
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-lg">person</span>
                                {contract.client_name}
                            </span>
                            {contract.event_date && (
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-lg">event</span>
                                    {formatDate(contract.event_date)}
                                </span>
                            )}
                            {contract.value > 0 && (
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-lg">payments</span>
                                    {formatCurrency(contract.value)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Contract Body */}
                    <div className="p-6 md:p-8 relative">
                        {contract.watermark_url && (
                            <div
                                className="absolute inset-0 opacity-5 bg-center bg-no-repeat bg-contain pointer-events-none"
                                style={{ backgroundImage: `url(${contract.watermark_url})` }}
                            />
                        )}
                        <div
                            className="prose prose-slate max-w-none relative z-10"
                            style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                        >
                            {renderContractContent()}
                        </div>
                    </div>

                    {/* Signature Section */}
                    {signed && contract.signature_data && (
                        <div className="border-t border-slate-200 p-6 md:p-8 bg-slate-50">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-500">verified</span>
                                Assinatura Eletrônica
                            </h3>
                            <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 inline-block">
                                <img
                                    src={contract.signature_data}
                                    alt="Assinatura"
                                    className="max-h-24 object-contain"
                                />
                            </div>
                            <div className="mt-4 text-sm text-slate-600">
                                <p><strong>Assinado por:</strong> {contract.client_name}</p>
                                <p><strong>Data:</strong> {contract.signed_at && formatDate(contract.signed_at)}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Este documento foi assinado eletronicamente e tem validade jurídica conforme MP 2.200-2/2001.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Signature Modal */}
            {showSignatureModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !signing && setShowSignatureModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 fade-in duration-300">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Assinar Contrato</h2>
                                <p className="text-sm text-slate-500">Use o mouse ou dedo para desenhar sua assinatura</p>
                            </div>
                            <button
                                onClick={() => setShowSignatureModal(false)}
                                disabled={signing}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6">
                            {signing ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-slate-600 font-medium">Salvando assinatura...</p>
                                </div>
                            ) : (
                                <SignaturePad onSave={handleSignature} />
                            )}
                        </div>

                        <div className="p-4 bg-amber-50 border-t border-amber-200 rounded-b-2xl">
                            <p className="text-xs text-amber-700 flex items-start gap-2">
                                <span className="material-symbols-outlined text-lg flex-shrink-0">info</span>
                                Ao confirmar, você declara que leu e concorda com todos os termos deste contrato.
                                A assinatura eletrônica é legalmente válida conforme a legislação brasileira.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white mt-8">
                <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
                    <p>Documento digital com validade jurídica</p>
                    <p className="text-xs text-slate-400 mt-1">
                        Facilita Teoo • Sistema de Gestão de Contratos
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default ContractSign;
