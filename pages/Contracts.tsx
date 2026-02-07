import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Smart Tags Configuration
const SMART_TAGS = {
  cliente: [
    { label: 'Nome do Cliente', tag: '[Nome do Cliente]' },
    { label: 'CPF do Cliente', tag: '[CPF do Cliente]' },
    { label: 'Email do Cliente', tag: '[Email do Cliente]' },
    { label: 'Telefone', tag: '[Telefone]' },
    { label: 'Endereço do Cliente', tag: '[Endereço do Cliente]' },
  ],
  evento: [
    { label: 'Data do Evento', tag: '[Data do Evento]' },
    { label: 'Local do Evento', tag: '[Local do Evento]' },
    { label: 'Horário', tag: '[Horário]' },
    { label: 'Tipo de Evento', tag: '[Tipo de Evento]' },
  ],
  financeiro: [
    { label: 'Valor Total', tag: '[Valor Total]' },
    { label: 'Valor Pronto (Equipamentos)', tag: '[VALORPRONTO]' },
    { label: 'Condições de Pagamento', tag: '[Condições de Pagamento]' },
    { label: 'Multa por Atraso', tag: '[Multa por Atraso]' },
  ],
  empresa: [
    { label: 'Nome da Empresa', tag: '[Nome da Empresa]' },
    { label: 'Endereço da Empresa', tag: '[Endereço da Empresa]' },
    { label: 'CNPJ', tag: '[CNPJ]' },
  ],
};

interface Lead {
  id: string;
  name: string;
  interest?: string;
  email?: string;
  phone?: string;
}

interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  created_at: string;
  logo_url?: string;
  watermark_url?: string;
  watermark_opacity?: number;
  color?: string;
}

interface Contract {
  id: string;
  client_name: string;
  client_initials: string;
  type: string;
  event_date: string;
  value: number;
  status: string;
  template_id?: string;
  filled_content?: string;
  share_token?: string;
  logo_url?: string;
  watermark_url?: string;
  lead_id?: string;
  signature_data?: string;
  signed_at?: string;
  color?: string;
  tag_values?: Record<string, string>;
  selected_equipment?: string[];
  custom_equipment_text?: string;
}

interface CustomTag {
  id: string;
  name: string;
  tag: string;
  options: string[];
}

type ViewMode = 'list' | 'templates' | 'edit-template' | 'new-contract' | 'fill-contract' | 'view-contract' | 'custom-tags';

const ContractsView: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [equipment, setEquipment] = useState<{ id: string; name: string; category: string; total: number; unit_price: number }[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [customEquipmentText, setCustomEquipmentText] = useState('');
  const [loading, setLoading] = useState(true);

  // Template Editor State
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [templateLogoUrl, setTemplateLogoUrl] = useState('');
  const [templateWatermarkUrl, setTemplateWatermarkUrl] = useState('');
  const [templateColor, setTemplateColor] = useState('#a413ec');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingWatermark, setUploadingWatermark] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  // New Contract State
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [tagValues, setTagValues] = useState<Record<string, string>>({});
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [newLeadData, setNewLeadData] = useState({ name: '', email: '', phone: '' });
  const [newContractData, setNewContractData] = useState({
    client_name: '',
    type: '',
    event_date: '',
    value: 0,
  });
  const [editingContractId, setEditingContractId] = useState<string | null>(null);

  // View Contract State
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  // Custom Tags State
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [showCustomTagModal, setShowCustomTagModal] = useState(false);
  const [editingCustomTag, setEditingCustomTag] = useState<CustomTag | null>(null);
  const [newCustomTag, setNewCustomTag] = useState({ name: '', tag: '', options: '' });
  const [copySuccess, setCopySuccess] = useState(false);

  // State for mobile tags panel
  const [showMobileTags, setShowMobileTags] = React.useState(false);

  // Fetch data
  useEffect(() => {
    fetchContracts();
    fetchTemplates();
    fetchLeads();
    fetchEquipment();
    fetchCustomTags();
  }, []);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setContracts(data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('name', { ascending: true });
    if (data) setLeads(data);
  };

  const fetchEquipment = async () => {
    const { data } = await supabase
      .from('equipment')
      .select('id, name, category, total, unit_price')
      .eq('status', 'available')
      .order('name', { ascending: true });
    if (data) setEquipment(data);
  };

  const fetchCustomTags = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_tags')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        setCustomTags(data);
        return;
      }
    } catch (e) {
      // Table doesn't exist, use localStorage
    }
    // Fallback to localStorage
    const stored = localStorage.getItem('customTags');
    if (stored) {
      setCustomTags(JSON.parse(stored));
    }
  };

  const saveCustomTag = async () => {
    if (!newCustomTag.name.trim() || !newCustomTag.tag.trim()) return;

    const tagFormatted = newCustomTag.tag.startsWith('[') ? newCustomTag.tag : `[${newCustomTag.tag}]`;
    const optionsArray = newCustomTag.options.split('\n').filter(opt => opt.trim());

    const tagData = {
      id: editingCustomTag?.id || crypto.randomUUID(),
      name: newCustomTag.name.trim(),
      tag: tagFormatted.toUpperCase(),
      options: optionsArray,
    };

    // Try Supabase first
    try {
      if (editingCustomTag) {
        const { error } = await supabase
          .from('custom_tags')
          .update({
            name: tagData.name,
            tag: tagData.tag,
            options: tagData.options,
          })
          .eq('id', editingCustomTag.id);

        if (!error) {
          fetchCustomTags();
          setShowCustomTagModal(false);
          setEditingCustomTag(null);
          setNewCustomTag({ name: '', tag: '', options: '' });
          return;
        }
      } else {
        const { error } = await supabase
          .from('custom_tags')
          .insert({
            name: tagData.name,
            tag: tagData.tag,
            options: tagData.options,
          });

        if (!error) {
          fetchCustomTags();
          setShowCustomTagModal(false);
          setNewCustomTag({ name: '', tag: '', options: '' });
          return;
        }
      }
    } catch (e) {
      // Table doesn't exist, use localStorage
    }

    // Fallback to localStorage
    let tags = [...customTags];
    if (editingCustomTag) {
      tags = tags.map(t => t.id === editingCustomTag.id ? tagData : t);
    } else {
      tags.push(tagData);
    }
    localStorage.setItem('customTags', JSON.stringify(tags));
    setCustomTags(tags);
    setShowCustomTagModal(false);
    setEditingCustomTag(null);
    setNewCustomTag({ name: '', tag: '', options: '' });
  };

  const editCustomTag = (tag: CustomTag) => {
    setEditingCustomTag(tag);
    setNewCustomTag({
      name: tag.name,
      tag: tag.tag,
      options: tag.options.join('\n'),
    });
    setShowCustomTagModal(true);
  };

  const deleteCustomTag = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tag?')) return;

    // Try Supabase first
    try {
      const { error } = await supabase
        .from('custom_tags')
        .delete()
        .eq('id', id);

      if (!error) {
        fetchCustomTags();
        return;
      }
    } catch (e) {
      // Table doesn't exist, use localStorage
    }

    // Fallback to localStorage
    const tags = customTags.filter(t => t.id !== id);
    localStorage.setItem('customTags', JSON.stringify(tags));
    setCustomTags(tags);
  };

  const createQuickLead = async () => {
    if (!newLeadData.name.trim()) return;

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: newLeadData.name,
        email: newLeadData.email,
        phone: newLeadData.phone,
        interest: newContractData.type || 'Contrato',
        status: 'qualified',
      })
      .select()
      .single();

    if (!error && data) {
      setLeads([...leads, data]);
      setSelectedLeadId(data.id);
      setNewContractData({ ...newContractData, client_name: data.name });
      setNewLeadData({ name: '', email: '', phone: '' });
      setShowNewLeadForm(false);
    }
  };

  // Template Functions
  const insertTag = (tag: string) => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      const newContent = templateContent.substring(0, start) + tag + templateContent.substring(end);
      setTemplateContent(newContent);

      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          editorRef.current.setSelectionRange(start + tag.length, start + tag.length);
        }
      }, 0);
    }
  };

  const applyFormat = (format: string) => {
    if (!editorRef.current) return;
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const selectedText = templateContent.substring(start, end);
    let newText = '';

    switch (format) {
      case 'bold': newText = `<b>${selectedText}</b>`; break;
      case 'italic': newText = `<i>${selectedText}</i>`; break;
      case 'underline': newText = `<u>${selectedText}</u>`; break;
      case 'list-bullet': newText = `<ul>\n<li>${selectedText}</li>\n</ul>`; break;
      case 'list-number': newText = `<ol>\n<li>${selectedText}</li>\n</ol>`; break;
      case 'align-left': newText = `<div style="text-align: left">${selectedText}</div>`; break;
      case 'align-center': newText = `<div style="text-align: center">${selectedText}</div>`; break;
      case 'align-right': newText = `<div style="text-align: right">${selectedText}</div>`; break;
    }

    const newContent = templateContent.substring(0, start) + newText + templateContent.substring(end);
    setTemplateContent(newContent);

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        const newCursorPos = start + newText.length;
        editorRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !templateContent.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (editingTemplateId) {
        const { error } = await supabase
          .from('contract_templates')
          .update({
            name: templateName,
            content: templateContent,
            logo_url: templateLogoUrl || null,
            watermark_url: templateWatermarkUrl || null,
            color: templateColor,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplateId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contract_templates')
          .insert({
            name: templateName,
            content: templateContent,
            logo_url: templateLogoUrl || null,
            watermark_url: templateWatermarkUrl || null,
            color: templateColor,
            user_id: user.id
          });

        if (error) throw error;
      }

      setTemplateName('');
      setTemplateContent('');
      setTemplateLogoUrl('');
      setTemplateColor('#a413ec');
      setTemplateWatermarkUrl('');
      setEditingTemplateId(null);
      setViewMode('templates');
      fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert('Erro ao salvar modelo: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'watermark') => {
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingWatermark(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('contract-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('contract-images')
        .getPublicUrl(fileName);

      if (type === 'logo') {
        setTemplateLogoUrl(publicUrl);
      } else {
        setTemplateWatermarkUrl(publicUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erro ao fazer upload. Tente novamente.');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingWatermark(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'watermark') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      uploadImage(file, type);
    }
  };

  const removeImage = (type: 'logo' | 'watermark') => {
    if (type === 'logo') {
      setTemplateLogoUrl('');
      if (logoInputRef.current) logoInputRef.current.value = '';
    } else {
      setTemplateWatermarkUrl('');
      if (watermarkInputRef.current) watermarkInputRef.current.value = '';
    }
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from('contract_templates').delete().eq('id', id);
    fetchTemplates();
  };

  const editTemplate = (template: ContractTemplate) => {
    setTemplateName(template.name);
    setTemplateContent(template.content);
    setTemplateLogoUrl(template.logo_url || '');
    setTemplateWatermarkUrl(template.watermark_url || '');
    setTemplateColor(template.color || '#a413ec');
    setEditingTemplateId(template.id);
    setViewMode('edit-template');
  };

  const editContract = (contract: Contract) => {
    const template = templates.find(t => t.id === contract.template_id);
    if (!template) {
      alert('Modelo original não encontrado. Não é possível editar.');
      return;
    }

    setSelectedTemplate(template);
    setTagValues(contract.tag_values || {});
    setSelectedEquipment(contract.selected_equipment || []);
    setCustomEquipmentText(contract.custom_equipment_text || '');

    // Set form data
    setNewContractData({
      client_name: contract.client_name,
      type: contract.type,
      event_date: contract.event_date ? new Date(contract.event_date).toISOString().split('T')[0] : '',
      value: contract.value
    });

    if (contract.lead_id) setSelectedLeadId(contract.lead_id);
    setEditingContractId(contract.id);
    setViewMode('fill-contract');
  };

  // Contract Functions
  const extractTagsFromContent = (content: string): string[] => {
    const regex = /\[([^\]]+)\]/g;
    const matches = content.match(regex) || [];
    return [...new Set(matches)];
  };

  const selectTemplateForContract = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    const tags = extractTagsFromContent(template.content);
    const initialValues: Record<string, string> = {};
    tags.forEach(tag => { initialValues[tag] = ''; });
    setTagValues(initialValues);
    setTagValues(initialValues);
    setSelectedEquipment([]);
    setCustomEquipmentText('');
    setEditingContractId(null);
    setNewContractData({ client_name: '', type: '', event_date: '', value: 0 });
    setViewMode('fill-contract');
  };

  const generateFilledContent = (): string => {
    if (!selectedTemplate) return '';
    let content = selectedTemplate.content;

    // Handle [EQUIPAMENTOS] tag specially - replace with selected equipment list
    if (content.includes('[EQUIPAMENTOS]')) {
      const equipmentList = selectedEquipment
        .map(id => equipment.find(e => e.id === id)?.name)
        .filter(Boolean);

      // Add custom equipment text if provided
      if (customEquipmentText.trim()) {
        const customItems = customEquipmentText.split('\n').filter(line => line.trim());
        equipmentList.push(...customItems);
      }

      const equipmentText = equipmentList.length > 0
        ? equipmentList.map(item => `- ${item}`).join('\n')
        : 'Nenhum equipamento selecionado';
      content = content.replaceAll('[EQUIPAMENTOS]', equipmentText);
    }

    // Handle [VALORPRONTO] tag - sum of selected equipment service prices (not multiplied by quantity)
    if (content.includes('[VALORPRONTO]')) {
      const totalEquipmentValue = selectedEquipment
        .map(id => equipment.find(e => e.id === id))
        .filter(Boolean)
        .reduce((sum, eq) => sum + (eq?.unit_price || 0), 0);

      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(totalEquipmentValue);

      content = content.replaceAll('[VALORPRONTO]', formattedValue);
    }

    Object.entries(tagValues).forEach(([tag, value]) => {
      if (tag !== '[EQUIPAMENTOS]' && tag !== '[VALORPRONTO]') {
        content = content.replaceAll(tag, value || tag);
      }
    });
    return content;
  };

  const generateShareToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const createContract = async () => {
    if (!selectedTemplate) return;

    try {
      const filledContent = generateFilledContent();
      const clientInitials = newContractData.client_name
        ? newContractData.client_name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
        : '??';

      const shareToken = generateShareToken();

      // Extract values from tags if direct fields are empty
      const eventType = newContractData.type || tagValues['[Tipo de Evento]'] || 'Contrato';
      const eventDate = newContractData.event_date || tagValues['[Data do Evento]'] || '';
      const contractValue = newContractData.value || parseFloat(tagValues['[Valor Total]']?.replace(/[^\d,]/g, '').replace(',', '.') || '0') || 0;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado. Por favor, faça login novamente.');

      const contractData = {
        client_name: newContractData.client_name || 'Cliente sem nome',
        client_initials: clientInitials,
        type: eventType,
        event_date: eventDate || null,
        value: contractValue,
        status: 'draft',
        template_id: selectedTemplate.id,
        filled_content: filledContent,
        share_token: shareToken,
        lead_id: selectedLeadId || null,
        user_id: user.id,
        color: selectedTemplate.color || '#a413ec',
        tag_values: tagValues,
        selected_equipment: selectedEquipment,
        custom_equipment_text: customEquipmentText
      };

      if (editingContractId) {
        const { error } = await supabase
          .from('contracts')
          .update(contractData)
          .eq('id', editingContractId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contracts').insert(contractData);
        if (error) throw error;
      }



      setSelectedTemplate(null);
      setTagValues({});
      setNewContractData({ client_name: '', type: '', event_date: '', value: 0 });
      setEditingContractId(null);
      setViewMode('list');
      fetchContracts();
    } catch (error: any) {
      console.error('Error creating contract:', error);
      alert('Erro ao criar contrato: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const updateContractStatus = async (id: string, status: string) => {
    await supabase.from('contracts').update({ status }).eq('id', id);
    fetchContracts();
  };

  const deleteContract = async (id: string) => {
    await supabase.from('contracts').delete().eq('id', id);
    fetchContracts();
  };

  // View & Export Functions
  const viewContract = (contract: Contract) => {
    setViewingContract(contract);
    setShareLink(null);
    setViewMode('view-contract');
  };

  const generateShareLink = async (contract: Contract) => {
    let token = contract.share_token;

    if (!token) {
      token = generateShareToken();
      await supabase.from('contracts').update({ share_token: token }).eq('id', contract.id);
      fetchContracts();
    }

    const link = `${window.location.origin}/contrato/${token}`;
    setShareLink(link);
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const printContract = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get the associated template for logo/watermark
    const template = viewingContract?.template_id
      ? templates.find(t => t.id === viewingContract.template_id)
      : null;

    const logoUrl = template?.logo_url || viewingContract?.logo_url || '';
    const watermarkUrl = template?.watermark_url || viewingContract?.watermark_url || '';
    const primaryColor = viewingContract?.color || template?.color || '#a413ec';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contrato - ${viewingContract?.client_name}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              line-height: 1.6;
              color: #333;
              position: relative;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 50%;
              max-width: 400px;
              opacity: 0.08;
              z-index: -1;
              pointer-events: none;
            }
            .logo-container {
              text-align: center;
              margin-bottom: 20px;
            }
            .logo-container img {
              max-height: 80px;
              max-width: 200px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid ${primaryColor};
            }
            .header h1 {
              color: ${primaryColor};
              margin: 0;
            }
            .content {
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { padding: 20px; }
              .watermark { position: fixed; }
            }
          </style>
        </head>
        <body>
          ${watermarkUrl ? `<img class="watermark" src="${watermarkUrl}" alt="" />` : ''}
          ${logoUrl ? `<div class="logo-container"><img src="${logoUrl}" alt="Logo" /></div>` : ''}
          <div class="header">
            <h1>CONTRATO</h1>
            <p>Cliente: ${viewingContract?.client_name} | Tipo: ${viewingContract?.type}</p>
          </div>
          <div class="content">${viewingContract?.filled_content || ''}</div>
          <div class="footer">
            <p>Documento gerado pelo Facilita Teoo</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const downloadPDF = () => {
    // Using print dialog with "Save as PDF" option
    printContract();
  };

  const formatCurrency = (value: any) => {
    const amount = typeof value === 'number' ? value : parseFloat(String(value || 0).replace(',', '.'));
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(amount) ? 0 : amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return '-';
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || 'draft').toLowerCase();
    const styles: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400',
      pending: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
      signed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    };
    const labels: Record<string, string> = {
      draft: 'RASCUNHO',
      pending: 'PENDENTE ASSINATURA',
      signed: 'ASSINADO',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[s] || styles.draft}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s === 'signed' ? 'bg-emerald-500' : s === 'pending' ? 'bg-indigo-500' : 'bg-slate-400'}`}></span>
        {labels[s] || s.toUpperCase()}
      </span>
    );
  };

  // Contract Viewer
  if (viewMode === 'view-contract' && viewingContract) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('list')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-3xl font-black text-[#161118] dark:text-white tracking-tight">Visualizar Contrato</h1>
              <p className="text-[#7c6189] dark:text-purple-200/70 text-base mt-1">{viewingContract.client_name} • {viewingContract.type}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => alert('Este recurso estará disponível no lançamento oficial da plataforma.')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-[#e2dbe6] dark:border-[#31253a] rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-xl">lock</span>
              Gerar Link (Em Breve)
            </button>
            <button onClick={printContract} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-[#e2dbe6] dark:border-[#31253a] rounded-xl text-sm font-bold hover:bg-[#f3f0f4] transition-all">
              <span className="material-symbols-outlined text-xl">print</span>
              Imprimir
            </button>
            <button onClick={downloadPDF} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary-hover transition-all">
              <span className="material-symbols-outlined text-xl">download</span>
              Baixar PDF
            </button>
          </div>
        </div>

        {/* Share Link Section */}
        {shareLink && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">check_circle</span>
              <h3 className="font-bold text-emerald-700 dark:text-emerald-400">Link gerado com sucesso!</h3>
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-300 mb-4">Envie este link para seu cliente visualizar e baixar o contrato:</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-4 py-3 bg-white dark:bg-white/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-sm"
              />
              <button
                onClick={copyShareLink}
                className={`px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${copySuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">{copySuccess ? 'check' : 'content_copy'}</span>
                {copySuccess ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        {/* Contract Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Cliente', value: viewingContract.client_name, icon: 'person' },
            { label: 'Tipo de Evento', value: viewingContract.type, icon: 'celebration' },
            { label: 'Data do Evento', value: formatDate(viewingContract.event_date), icon: 'calendar_month' },
            { label: 'Valor', value: formatCurrency(viewingContract.value), icon: 'payments' },
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-xl">{item.icon}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#7c6189]">{item.label}</span>
              </div>
              <p className="text-lg font-bold text-[#161118] dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Contract Content */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] overflow-hidden">
          <div className="p-5 border-b border-[#e2dbe6] dark:border-[#31253a] flex items-center justify-between">
            <h3 className="font-bold text-[#161118] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">description</span>
              Conteúdo do Contrato
            </h3>
            {getStatusBadge(viewingContract.status)}
          </div>
          <div ref={printRef} className="p-8 bg-white dark:bg-[#1a141f]">
            <div
              className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-[#161118] dark:text-white leading-relaxed"
              dangerouslySetInnerHTML={{ __html: viewingContract.filled_content || 'Conteúdo não disponível.' }}
            />
          </div>
        </div>
      </div>
    );
  }



  // Template Editor View
  if (viewMode === 'edit-template') {
    return (
      <div className="h-full flex flex-col animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setViewMode('templates'); setEditingTemplateId(null); setTemplateName(''); setTemplateContent(''); setTemplateColor('#a413ec'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors flex-shrink-0">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex items-center gap-2 text-primary min-w-0">
              <span className="material-symbols-outlined flex-shrink-0">description</span>
              <h2 className="text-base md:text-lg font-bold text-[#161118] dark:text-white truncate">{editingTemplateId ? 'Editar' : 'Criar'} Modelo de Contrato</h2>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button onClick={() => { setViewMode('templates'); setEditingTemplateId(null); }} className="px-3 sm:px-5 py-2 sm:py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors">
              Cancelar
            </button>
            <button onClick={saveTemplate} className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary-hover transition-all">
              <span className="material-symbols-outlined text-lg sm:text-xl">save</span>
              <span className="hidden sm:inline">Salvar</span> Modelo
            </button>
          </div>
        </div>

        {/* Editor Layout */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 relative">
          {/* Editor Panel */}
          <div className="flex-1 flex flex-col bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] overflow-hidden">
            {/* Template Name */}
            <div className="p-4 md:p-6 border-b border-[#e2dbe6] dark:border-[#31253a]">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Nome do Modelo</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Ex: Contrato de Prestação de Serviços - Casamento"
                    className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">image</span> Logo da Empresa</span>
                    </label>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'logo')}
                      className="hidden"
                    />
                    {templateLogoUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-[#f3f0f4] dark:bg-white/5 rounded-xl">
                        <img src={templateLogoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-emerald-600 font-bold truncate">Logo carregado</p>
                        </div>
                        <button onClick={() => removeImage('logo')} className="p-1 text-red-500 hover:bg-red-50 rounded-lg">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#e2dbe6] dark:border-[#31253a] rounded-xl text-sm font-bold text-[#7c6189] hover:border-primary hover:text-primary transition-all disabled:opacity-50"
                      >
                        {uploadingLogo ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-lg">upload</span>
                            Carregar Logo
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">water_drop</span> Marca D'Água</span>
                    </label>
                    <input
                      ref={watermarkInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'watermark')}
                      className="hidden"
                    />
                    {templateWatermarkUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-[#f3f0f4] dark:bg-white/5 rounded-xl">
                        <img src={templateWatermarkUrl} alt="Watermark" className="h-10 w-auto object-contain opacity-50" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-emerald-600 font-bold truncate">Marca carregada</p>
                        </div>
                        <button onClick={() => removeImage('watermark')} className="p-1 text-red-500 hover:bg-red-50 rounded-lg">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => watermarkInputRef.current?.click()}
                        disabled={uploadingWatermark}
                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#e2dbe6] dark:border-[#31253a] rounded-xl text-sm font-bold text-[#7c6189] hover:border-primary hover:text-primary transition-all disabled:opacity-50"
                      >
                        {uploadingWatermark ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-lg">upload</span>
                            Carregar Marca D'Água
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">
                    Cor do Tema
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-[#f3f0f4] dark:bg-white/5 rounded-xl cursor-pointer" onClick={() => document.getElementById('color-picker')?.click()}>
                    <div
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: templateColor }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#161118] dark:text-white">Cor Principal</p>
                      <p className="text-xs text-[#7c6189]">{templateColor}</p>
                    </div>
                    <input
                      id="color-picker"
                      type="color"
                      value={templateColor}
                      onChange={(e) => setTemplateColor(e.target.value)}
                      className="opacity-0 w-0 h-0 absolute"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-4 md:px-6 py-2 md:py-3 border-b border-[#e2dbe6] dark:border-[#31253a] flex gap-1 overflow-x-auto">
              {[
                { icon: 'format_bold', action: 'bold' },
                { icon: 'format_italic', action: 'italic' },
                { icon: 'format_underlined', action: 'underline' }, // Note: Browser execCommand or manual wrap
                { icon: 'format_list_bulleted', action: 'list-bullet' },
                { icon: 'format_list_numbered', action: 'list-number' },
                { icon: 'format_align_left', action: 'align-left' },
                { icon: 'format_align_center', action: 'align-center' },
                { icon: 'format_align_right', action: 'align-right' }
              ].map((item) => (
                <button
                  key={item.icon}
                  onClick={() => applyFormat(item.action)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-primary"
                  title={item.action}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </button>
              ))}
            </div>

            {/* Content Editor */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
              <textarea
                ref={editorRef}
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                placeholder="Digite o conteúdo do contrato aqui. Use as tags inteligentes à direita para inserir campos dinâmicos..."
                className="w-full h-full min-h-[250px] md:min-h-[400px] bg-transparent border-none resize-none text-sm leading-relaxed focus:outline-none text-[#161118] dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Mobile Tags Toggle Button */}
          <button
            onClick={() => setShowMobileTags(!showMobileTags)}
            className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary-hover transition-all"
          >
            <span className="material-symbols-outlined">{showMobileTags ? 'close' : 'sell'}</span>
          </button>

          {/* Tags Panel Overlay for Mobile */}
          {showMobileTags && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-30"
              onClick={() => setShowMobileTags(false)}
            />
          )}

          {/* Tags Panel */}
          <div className={`
            lg:relative lg:translate-x-0 lg:w-72
            fixed inset-y-0 right-0 z-40 w-80 max-w-[85vw]
            transform transition-transform duration-300 ease-in-out
            ${showMobileTags ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            bg-white dark:bg-[#1F1823] lg:dark:bg-white/5 rounded-l-2xl lg:rounded-2xl border-l lg:border border-[#e2dbe6] dark:border-[#31253a] p-5 overflow-y-auto
            lg:flex lg:flex-col
            ${!showMobileTags && 'hidden lg:flex'}
          `}>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">sell</span>
              <h3 className="font-bold text-[#161118] dark:text-white">Tags Inteligentes</h3>
            </div>
            <p className="text-xs text-[#7c6189] mb-6">Clique nas tags para inseri-las automaticamente na posição do cursor no seu documento.</p>

            {Object.entries(SMART_TAGS).map(([category, tags]) => (
              <div key={category} className="mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#7c6189] mb-3">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <button
                      key={t.tag}
                      onClick={() => insertTag(t.tag)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#f3f0f4] dark:bg-white/5 border border-[#e2dbe6] dark:border-[#31253a] rounded-lg text-xs font-bold text-[#7c6189] hover:border-primary hover:text-primary transition-all"
                    >
                      <span className="text-primary">+</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Tags Especiais - Info Cards */}
            <div className="mt-6 pt-6 border-t border-[#e2dbe6] dark:border-[#31253a] space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#7c6189] mb-3">Tags Especiais</h4>

              {/* EQUIPAMENTOS Tag */}
              <button
                onClick={() => insertTag('[EQUIPAMENTOS]')}
                className="w-full text-left bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-500/10 dark:to-fuchsia-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-3 hover:border-purple-400 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-purple-600 dark:text-purple-400">inventory_2</span>
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-300 group-hover:text-purple-600">[EQUIPAMENTOS]</span>
                  <span className="text-primary text-xs ml-auto">+ inserir</span>
                </div>
                <p className="text-[10px] text-purple-700 dark:text-purple-400">
                  Lista automaticamente os equipamentos selecionados no contrato.
                </p>
              </button>

              {/* VALORPRONTO Tag */}
              <button
                onClick={() => insertTag('[VALORPRONTO]')}
                className="w-full text-left bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3 hover:border-blue-400 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-blue-600 dark:text-blue-400">payments</span>
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 group-hover:text-blue-600">[VALORPRONTO]</span>
                  <span className="text-primary text-xs ml-auto">+ inserir</span>
                </div>
                <p className="text-[10px] text-blue-700 dark:text-blue-400">
                  Calcula automaticamente o valor total dos equipamentos selecionados.
                </p>
              </button>

              {/* Custom Tags */}
              {customTags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#e2dbe6] dark:border-[#31253a]">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#7c6189] mb-3">Suas Tags Personalizadas</h4>
                  <div className="space-y-2">
                    {customTags.map((ct) => (
                      <button
                        key={ct.id}
                        onClick={() => insertTag(ct.tag)}
                        className="w-full text-left bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-3 hover:border-emerald-400 transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">sell</span>
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 group-hover:text-emerald-600">{ct.tag}</span>
                          <span className="text-primary text-xs ml-auto">+ inserir</span>
                        </div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                          {ct.name} • {ct.options.length} opções
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Custom Tags Management View
  if (viewMode === 'custom-tags') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('list')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-4xl font-black text-[#161118] dark:text-white tracking-tight">Tags Personalizadas</h1>
              <p className="text-[#7c6189] dark:text-purple-200/70 text-lg mt-1">Crie tags com opções pré-definidas para seus contratos.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingCustomTag(null);
              setNewCustomTag({ name: '', tag: '', options: '' });
              setShowCustomTagModal(true);
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary-hover transition-all"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Nova Tag
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">lightbulb</span>
          </div>
          <div>
            <h3 className="font-bold text-amber-900 dark:text-amber-300">Como usar Tags Personalizadas</h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Crie tags com opções pré-definidas para facilitar o preenchimento de contratos.
              Por exemplo, crie uma tag <code className="bg-amber-200 dark:bg-amber-500/30 px-1.5 py-0.5 rounded font-mono text-xs">[PAGAMENTO]</code> com
              opções como "PIX", "Cartão de Crédito", "Boleto Bancário", etc. Ao criar um contrato, você poderá selecionar uma das opções ao invés de digitar.
            </p>
          </div>
        </div>

        {customTags.length === 0 ? (
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-[#7c6189]/30 mb-4">sell</span>
            <h3 className="text-lg font-bold text-[#161118] dark:text-white mb-2">Nenhuma tag personalizada</h3>
            <p className="text-sm text-[#7c6189] mb-6">Crie sua primeira tag personalizada para começar.</p>
            <button
              onClick={() => {
                setEditingCustomTag(null);
                setNewCustomTag({ name: '', tag: '', options: '' });
                setShowCustomTagModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary-hover transition-all"
            >
              <span className="material-symbols-outlined">add</span>
              Criar Primeira Tag
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customTags.map((tag) => (
              <div key={tag.id} className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6 hover:shadow-lg transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">sell</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editCustomTag(tag)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-primary">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button onClick={() => deleteCustomTag(tag.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-500">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-[#161118] dark:text-white mb-1 group-hover:text-primary transition-colors">{tag.name}</h3>
                <code className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">{tag.tag}</code>
                <div className="mt-4 pt-4 border-t border-[#e2dbe6] dark:border-[#31253a]">
                  <p className="text-[10px] font-bold uppercase text-[#7c6189] mb-2">Opções ({tag.options.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {tag.options.slice(0, 5).map((option, i) => (
                      <span key={i} className="text-xs bg-[#f3f0f4] dark:bg-white/10 px-2 py-1 rounded-lg">{option}</span>
                    ))}
                    {tag.options.length > 5 && (
                      <span className="text-xs text-[#7c6189]">+{tag.options.length - 5} mais</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Creating/Editing Custom Tag */}
        {showCustomTagModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1F1823] rounded-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#161118] dark:text-white">
                  {editingCustomTag ? 'Editar Tag' : 'Nova Tag Personalizada'}
                </h2>
                <button
                  onClick={() => {
                    setShowCustomTagModal(false);
                    setEditingCustomTag(null);
                    setNewCustomTag({ name: '', tag: '', options: '' });
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Nome da Tag</label>
                  <input
                    type="text"
                    value={newCustomTag.name}
                    onChange={(e) => setNewCustomTag({ ...newCustomTag, name: e.target.value })}
                    placeholder="Ex: Forma de Pagamento"
                    className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Tag (Identificador)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c6189] font-mono">[</span>
                    <input
                      type="text"
                      value={newCustomTag.tag.replace(/[\[\]]/g, '')}
                      onChange={(e) => setNewCustomTag({ ...newCustomTag, tag: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                      placeholder="PAGAMENTO"
                      className="w-full px-8 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/50 transition-all uppercase"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7c6189] font-mono">]</span>
                  </div>
                  <p className="text-[10px] text-[#7c6189] mt-1">Use letras maiúsculas e underscores. Ex: FORMA_PAGAMENTO</p>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Opções (uma por linha)</label>
                  <textarea
                    value={newCustomTag.options}
                    onChange={(e) => setNewCustomTag({ ...newCustomTag, options: e.target.value })}
                    placeholder="PIX&#10;Cartão de Crédito&#10;Cartão de Débito&#10;Boleto Bancário&#10;Dinheiro"
                    rows={6}
                    className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCustomTagModal(false);
                    setEditingCustomTag(null);
                    setNewCustomTag({ name: '', tag: '', options: '' });
                  }}
                  className="flex-1 px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveCustomTag}
                  disabled={!newCustomTag.name.trim() || !newCustomTag.tag.trim() || !newCustomTag.options.trim()}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingCustomTag ? 'Salvar Alterações' : 'Criar Tag'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Templates List View
  if (viewMode === 'templates') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('list')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-4xl font-black text-[#161118] dark:text-white tracking-tight">Modelos de Contrato</h1>
              <p className="text-[#7c6189] dark:text-purple-200/70 text-lg mt-1">Crie e gerencie modelos reutilizáveis para seus contratos.</p>
            </div>
          </div>
          <button onClick={() => setViewMode('edit-template')} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary-hover transition-all">
            <span className="material-symbols-outlined text-xl">add</span>
            Criar Modelo
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-[#7c6189]/30 mb-4">description</span>
            <h3 className="text-lg font-bold text-[#161118] dark:text-white mb-2">Nenhum modelo criado</h3>
            <p className="text-sm text-[#7c6189] mb-6">Crie seu primeiro modelo de contrato para começar a gerar contratos rapidamente.</p>
            <button onClick={() => setViewMode('edit-template')} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary-hover transition-all">
              <span className="material-symbols-outlined">add</span>
              Criar Primeiro Modelo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6 hover:shadow-lg transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">description</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editTemplate(template)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-primary">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button onClick={() => deleteTemplate(template.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-500">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-[#161118] dark:text-white mb-2 group-hover:text-primary transition-colors">{template.name}</h3>
                <p className="text-xs text-[#7c6189] line-clamp-2 mb-4">{template.content.substring(0, 100)}...</p>
                <div className="flex items-center justify-between text-[10px] text-[#7c6189]">
                  <span>{extractTagsFromContent(template.content).length} tags</span>
                  <span>{new Date(template.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Template Selection for New Contract
  if (viewMode === 'new-contract') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('list')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-4xl font-black text-[#161118] dark:text-white tracking-tight">Novo Contrato</h1>
              <p className="text-[#7c6189] dark:text-purple-200/70 text-lg mt-1">Selecione um modelo para criar seu contrato.</p>
            </div>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-[#7c6189]/30 mb-4">description</span>
            <h3 className="text-lg font-bold text-[#161118] dark:text-white mb-2">Nenhum modelo disponível</h3>
            <p className="text-sm text-[#7c6189] mb-6">Você precisa criar um modelo de contrato antes de gerar contratos.</p>
            <button onClick={() => setViewMode('edit-template')} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary-hover transition-all">
              <span className="material-symbols-outlined">add</span>
              Criar Modelo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => selectTemplateForContract(template)}
                className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6 hover:shadow-lg hover:border-primary/50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary text-2xl">description</span>
                </div>
                <h3 className="font-bold text-[#161118] dark:text-white mb-2 group-hover:text-primary transition-colors">{template.name}</h3>
                <p className="text-xs text-[#7c6189] line-clamp-2">{template.content.substring(0, 100)}...</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Fill Contract Tags
  if (viewMode === 'fill-contract' && selectedTemplate) {
    const tagsToFill = extractTagsFromContent(selectedTemplate.content);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode(editingContractId ? 'list' : 'new-contract')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-4xl font-black text-[#161118] dark:text-white tracking-tight">{editingContractId ? 'Editar Contrato' : 'Preencher Contrato'}</h1>
              <p className="text-[#7c6189] dark:text-purple-200/70 text-lg mt-1">Modelo: {selectedTemplate.name}</p>
            </div>
          </div>
          <button onClick={createContract} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary-hover transition-all">
            <span className="material-symbols-outlined text-xl">check</span>
            {editingContractId ? 'Salvar Alterações' : 'Criar Contrato'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6">
            <h3 className="font-bold text-[#161118] dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              Dados do Contrato
            </h3>

            <div className="space-y-4 mb-6">
              {/* Client Selection */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Cliente</label>
                {!showNewLeadForm ? (
                  <div className="space-y-2">
                    <select
                      value={selectedLeadId}
                      onChange={(e) => {
                        const lead = leads.find(l => l.id === e.target.value);
                        setSelectedLeadId(e.target.value);
                        if (lead) {
                          setNewContractData({ ...newContractData, client_name: lead.name });
                        }
                      }}
                      className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 transition-all"
                    >
                      <option value="">Selecione um cliente...</option>
                      {leads.map((lead) => (
                        <option key={lead.id} value={lead.id}>{lead.name} {lead.interest ? `(${lead.interest})` : ''}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewLeadForm(true)}
                      className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-[#e2dbe6] dark:border-[#31253a] rounded-xl text-xs font-bold text-[#7c6189] hover:border-primary hover:text-primary transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Cadastrar Novo Cliente
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 bg-[#f3f0f4] dark:bg-white/10 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#161118] dark:text-white">Novo Cliente</span>
                      <button onClick={() => setShowNewLeadForm(false)} className="text-[#7c6189] hover:text-primary">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newLeadData.name}
                      onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
                      placeholder="Nome completo *"
                      className="w-full px-4 py-2 bg-white dark:bg-white/5 border-none rounded-lg text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        value={newLeadData.email}
                        onChange={(e) => setNewLeadData({ ...newLeadData, email: e.target.value })}
                        placeholder="Email"
                        className="w-full px-4 py-2 bg-white dark:bg-white/5 border-none rounded-lg text-sm"
                      />
                      <input
                        type="tel"
                        value={newLeadData.phone}
                        onChange={(e) => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                        placeholder="Telefone"
                        className="w-full px-4 py-2 bg-white dark:bg-white/5 border-none rounded-lg text-sm"
                      />
                    </div>
                    <button
                      onClick={createQuickLead}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      Cadastrar e Selecionar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h3 className="font-bold text-[#161118] dark:text-white mb-4 flex items-center gap-2 pt-4 border-t border-[#e2dbe6] dark:border-[#31253a]">
              <span className="material-symbols-outlined text-primary">sell</span>
              Tags do Modelo
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {tagsToFill.map((tag) => {
                // Special handling for [EQUIPAMENTOS] tag
                if (tag === '[EQUIPAMENTOS]') {
                  // Calculate total equipment value for [VALORPRONTO]
                  const totalEquipmentValue = selectedEquipment
                    .map(id => equipment.find(e => e.id === id))
                    .filter(Boolean)
                    .reduce((sum, eq) => sum + (eq?.unit_price || 0), 0);

                  return (
                    <div key={tag} className="bg-[#f3f0f4] dark:bg-white/10 rounded-xl p-4">
                      <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary">inventory_2</span>
                        EQUIPAMENTOS
                      </label>
                      {equipment.length === 0 ? (
                        <p className="text-sm text-[#7c6189] italic">Nenhum equipamento cadastrado</p>
                      ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {equipment.map((item) => (
                            <label
                              key={item.id}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedEquipment.includes(item.id)
                                ? 'bg-primary/10 border-2 border-primary'
                                : 'bg-white dark:bg-white/5 border-2 border-transparent hover:border-primary/30'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedEquipment.includes(item.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedEquipment([...selectedEquipment, item.id]);
                                  } else {
                                    setSelectedEquipment(selectedEquipment.filter(id => id !== item.id));
                                  }
                                }}
                                className="w-5 h-5 rounded-md border-2 border-[#e2dbe6] text-primary focus:ring-primary/50"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-[#161118] dark:text-white">{item.name}</p>
                                <p className="text-xs text-[#7c6189]">{item.category} • {item.total} unidades</p>
                              </div>
                              {item.unit_price > 0 && (
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                      {selectedEquipment.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#e2dbe6] dark:border-[#31253a]">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-primary font-bold">
                              {selectedEquipment.length} equipamento{selectedEquipment.length > 1 ? 's' : ''} selecionado{selectedEquipment.length > 1 ? 's' : ''}
                            </p>
                            {totalEquipmentValue > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-[#7c6189]">[VALORPRONTO]:</span>
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEquipmentValue)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Custom/Unlisted Equipment */}
                      <div className="mt-4 pt-4 border-t border-[#e2dbe6] dark:border-[#31253a]">
                        <label className="text-xs font-bold text-[#7c6189] mb-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">edit_note</span>
                          Equipamentos Não Listados
                        </label>
                        <textarea
                          value={customEquipmentText}
                          onChange={(e) => setCustomEquipmentText(e.target.value)}
                          placeholder="Ex: Mesa de bilhar&#10;Telão 120 polegadas&#10;(um por linha)"
                          rows={3}
                          className="w-full px-4 py-3 bg-white dark:bg-white/5 border-2 border-dashed border-[#e2dbe6] dark:border-[#31253a] rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                        />
                        <p className="text-[10px] text-[#7c6189]/70 mt-1">Digite um equipamento por linha (valores não serão incluídos no [VALORPRONTO])</p>
                      </div>
                    </div>
                  );
                }

                // Check if tag is a custom tag with options
                const customTag = customTags.find(ct => ct.tag === tag);
                if (customTag) {
                  return (
                    <div key={tag} className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
                      <label className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">sell</span>
                        {customTag.name}
                        <code className="text-[10px] font-mono bg-emerald-200 dark:bg-emerald-500/30 px-1.5 py-0.5 rounded ml-auto">{tag}</code>
                      </label>
                      <select
                        value={tagValues[tag] || ''}
                        onChange={(e) => setTagValues({ ...tagValues, [tag]: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-white/10 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      >
                        <option value="">Selecione uma opção...</option>
                        {customTag.options.map((option, i) => (
                          <option key={i} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                // Normal tag input
                return (
                  <div key={tag}>
                    <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">{tag.replace(/[\[\]]/g, '')}</label>
                    <input
                      type="text"
                      value={tagValues[tag] || ''}
                      onChange={(e) => setTagValues({ ...tagValues, [tag]: e.target.value })}
                      placeholder={tag}
                      className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6">
            <h3 className="font-bold text-[#161118] dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">preview</span>
              Pré-visualização
            </h3>
            <div
              className="bg-[#f3f0f4] dark:bg-white/5 rounded-xl p-6 text-sm leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: generateFilledContent() }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-[#161118] dark:text-white tracking-tight">Contratos</h1>
          <p className="text-[#7c6189] dark:text-purple-200/70 text-sm md:text-lg mt-1">Visualize e gerencie todos os contratos de eventos.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button onClick={() => setViewMode('templates')} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-white dark:bg-white/5 border border-[#e2dbe6] dark:border-[#31253a] rounded-xl text-xs md:text-sm font-bold hover:bg-[#f3f0f4] transition-all">
            <span className="material-symbols-outlined text-lg md:text-xl">description</span>
            Modelos
          </button>
          <button onClick={() => setViewMode('custom-tags')} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-white dark:bg-white/5 border border-[#e2dbe6] dark:border-[#31253a] rounded-xl text-xs md:text-sm font-bold hover:bg-[#f3f0f4] transition-all">
            <span className="material-symbols-outlined text-lg md:text-xl">sell</span>
            Tags
          </button>
          <button onClick={() => setViewMode('new-contract')} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 bg-primary text-white rounded-xl text-xs md:text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary-hover transition-all">
            <span className="material-symbols-outlined text-lg md:text-xl">add</span>
            <span className="hidden sm:inline">Novo</span> Contrato
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-[#7c6189]/30 mb-4">description</span>
            <h3 className="text-lg font-bold text-[#161118] dark:text-white mb-2">Nenhum contrato criado</h3>
            <p className="text-sm text-[#7c6189] mb-6">Crie seu primeiro contrato para começar.</p>
            <button onClick={() => setViewMode('new-contract')} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary-hover transition-all">
              <span className="material-symbols-outlined">add</span>
              Criar Contrato
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 border-b border-[#e2dbe6] dark:border-[#31253a]">
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-[#7c6189] dark:text-purple-200/60">Cliente</th>
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-[#7c6189] dark:text-purple-200/60">Data do Evento</th>
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-[#7c6189] dark:text-purple-200/60">Valor</th>
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-[#7c6189] dark:text-purple-200/60">Status</th>
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-[#7c6189] dark:text-purple-200/60 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2dbe6] dark:divide-[#31253a]">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-[#f3f0f4] dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                            {contract.client_initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{contract.client_name}</p>
                            <p className="text-[10px] font-bold uppercase text-[#7c6189] tracking-tighter">{contract.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm text-slate-900 dark:text-white font-bold">{formatDate(contract.event_date)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(contract.value)}</p>
                      </td>
                      <td className="px-6 py-5">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => viewContract(contract)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-[#7c6189] hover:text-primary transition-all" title="Visualizar">
                            <span className="material-symbols-outlined text-xl">visibility</span>
                          </button>
                          <button onClick={() => editContract(contract)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl text-[#7c6189] hover:text-blue-600 transition-all" title="Editar">
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          {contract.status === 'draft' && (
                            <button onClick={() => updateContractStatus(contract.id, 'pending')} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl text-[#7c6189] hover:text-indigo-600 transition-all" title="Enviar para assinatura">
                              <span className="material-symbols-outlined text-xl">send</span>
                            </button>
                          )}
                          {contract.status === 'pending' && (
                            <button onClick={() => updateContractStatus(contract.id, 'signed')} className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl text-[#7c6189] hover:text-emerald-600 transition-all" title="Marcar como assinado">
                              <span className="material-symbols-outlined text-xl">check_circle</span>
                            </button>
                          )}
                          <button onClick={() => deleteContract(contract.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-[#7c6189] hover:text-red-500 transition-all" title="Excluir">
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-5 border-t border-[#e2dbe6] dark:border-[#31253a] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-bold text-[#7c6189]">Mostrando {contracts.length} contratos</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContractsView;
