import { Client, Project, Task, ActivityEntry } from '@/types/gestao';

export function seedGestaoData() {
  if (localStorage.getItem('aib_clients')) {
    return; // Already seeded
  }

  const clients: Client[] = [
    {
      id: 'c_autoescola',
      name: 'Autoescola Junior - Fortaleza',
      color: '#F39C12',
      segment: 'Serviços',
      services: ['Social Media', 'Tráfego Pago'],
      status: 'CLIENTES ATIVO',
      contactName: 'Junior',
      contactPhone: '85999999999',
      contactEmail: 'junior@autoescola.com',
      notes: 'Cliente muito focado no WhatsApp',
      comunicacao: 'FREQUENTE',
      crm: 'Tintim ativo',
      fontesTraFego: 'Meta/Google',
      formaPagamento: 'CARTÃO',
      dataUltimaReuniao: '2026-01-07',
      dataProximaReuniao: '2025-12-26', // As requested
      dataUltimaEdicao: null,
      customFields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'c_toro',
      name: 'Toro Burger',
      color: '#FF6B35',
      segment: 'Alimentação',
      services: ['Tráfego Pago'],
      status: 'CLIENTES ATIVO',
      contactName: 'João',
      contactPhone: '88999999999',
      contactEmail: 'joao@toro.com',
      notes: '',
      comunicacao: 'NORMAL',
      crm: '',
      fontesTraFego: 'Meta',
      formaPagamento: 'PIX',
      dataUltimaReuniao: null,
      dataProximaReuniao: null,
      dataUltimaEdicao: null,
      customFields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'c_plasfran',
      name: 'Plasfran',
      color: '#2ECC71',
      segment: 'Indústria',
      services: ['Institucional'],
      status: 'CLIENTES ATIVO',
      contactName: 'Francisco',
      contactPhone: '',
      contactEmail: '',
      notes: '',
      comunicacao: 'BAIXA',
      crm: '',
      fontesTraFego: 'Google',
      formaPagamento: 'BOLETO',
      dataUltimaReuniao: null,
      dataProximaReuniao: null,
      dataUltimaEdicao: null,
      customFields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'c_tellar',
      name: 'Tellar Soluções',
      color: '#3498DB',
      segment: 'Tecnologia',
      services: [],
      status: 'CLIENTES ATIVO',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
      comunicacao: 'NORMAL',
      crm: '',
      fontesTraFego: 'Orgânico',
      formaPagamento: 'PIX',
      dataUltimaReuniao: null,
      dataProximaReuniao: null,
      dataUltimaEdicao: null,
      customFields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'c_pontual',
      name: 'Pontual Conceito Visual',
      color: '#9B59B6',
      segment: 'Comunicação Visual',
      services: [],
      status: 'CLIENTES ATIVO',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
      comunicacao: 'NORMAL',
      crm: '',
      fontesTraFego: '',
      formaPagamento: 'TRANSFERÊNCIA',
      dataUltimaReuniao: null,
      dataProximaReuniao: null,
      dataUltimaEdicao: null,
      customFields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const projects: Project[] = [
    {
      id: 'p_autoescola_1',
      clientId: 'c_autoescola',
      name: 'Campanhas de Matrícula (Jan-Fev)',
      description: 'Captação de leads para matrículas de começo de ano.',
      type: 'Tráfego',
      status: 'Em andamento',
      priority: 'alta',
      startDate: '2026-01-01',
      deadline: '2026-02-28',
      assignedTo: [],
      tags: ['meta ads', 'google ads'],
      customFields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Identificadores de usuário mocados para referenciar (isso depende de como o AuthContext resolver os UUIDs do Supabase, 
  // mas aqui deixamos marcadores que no UI renderizarão se encontrarmos ou não)
  const cledilsonId = 'cledilson';
  const leticeId = 'letice';
  const rianId = 'rian';

  const tasks: Task[] = [
    {
      id: 't_auto_1',
      projectId: 'p_autoescola_1',
      clientId: 'c_autoescola',
      parentTaskId: null,
      title: 'Autoescola Junior - Fortaleza',
      description: 'Roteiros enviados! Aguardando aprovação',
      status: 'CLIENTES ATIVO',
      priority: 'normal',
      isMilestone: false,
      assignedTo: [cledilsonId], // Cledilson Junior
      startDate: null,
      dueDate: null,
      estimatedMinutes: null,
      trackedMinutes: 0,
      timerRunning: false,
      timerStartedAt: null,
      timerHistory: [],
      tags: [],
      dependencies: [],
      linkedTasks: [],
      checklists: [
        {
          id: 'chk_1',
          title: 'Checklist',
          items: [
            { id: 'item_1', text: 'Item 1', done: true, assignedTo: null, dueDate: null },
            { id: 'item_2', text: 'Item 2', done: false, assignedTo: null, dueDate: null },
            { id: 'item_3', text: 'Item 3', done: false, assignedTo: null, dueDate: null }
          ]
        }
      ],
      comments: [
        {
          id: 'com_1',
          userId: cledilsonId,
          type: 'comment',
          text: 'media de pelo menos 20 contatos pro dia @[rianId:Rian Oliveira]',
          resolved: false,
          resolvedAt: null,
          resolvedBy: null,
          reactions: [],
          replies: [],
          createdAt: '2026-01-26T09:45:00'
        },
        {
          id: 'com_2',
          userId: cledilsonId,
          type: 'comment',
          text: 'taxa de conversao? 1 a 3 por dia',
          resolved: false,
          resolvedAt: null,
          resolvedBy: null,
          reactions: [],
          replies: [],
          createdAt: '2026-01-26T09:46:00'
        },
        {
          id: 'com_3',
          userId: leticeId,
          type: 'comment',
          text: 'Dois novos criativos foram ativos na campanha',
          resolved: false,
          resolvedAt: null,
          resolvedBy: null,
          reactions: [],
          replies: [],
          createdAt: '2026-01-27T10:21:00'
        }
      ],
      attachments: [],
      customFields: [
        { fieldId: 'comunicacao', value: 'FREQUENTE' },
        { fieldId: 'crm', value: 'Tintim ativo' },
        { fieldId: 'dataProximaReuniao', value: '2025-12-26' },
        { fieldId: 'dataUltimaReuniao', value: '2026-01-07' },
        { fieldId: 'fontesTraFego', value: 'Meta/Google' },
        { fieldId: 'formaPagamento', value: 'CARTÃO' }
      ],
      activityLog: [],
      createdAt: '2026-01-20T00:00:00',
      updatedAt: '2026-02-10T09:54:00'
    }
  ];

  const activities: ActivityEntry[] = [
    {
      id: 'act_1',
      userId: leticeId,
      action: 'field_changed',
      field: 'FORMA DE PAGAMENTO',
      from: 'PIX',
      to: 'CARTÃO',
      description: 'alterou FORMA DE PAGAMENTO de PIX para CARTÃO',
      createdAt: '2026-02-10T09:54:00'
    }
  ];

  localStorage.setItem('aib_clients', JSON.stringify(clients));
  localStorage.setItem('aib_projects', JSON.stringify(projects));
  localStorage.setItem('aib_tasks', JSON.stringify(tasks));
  localStorage.setItem('aib_activities', JSON.stringify(activities));
  localStorage.setItem('aib_forms', JSON.stringify([]));
  localStorage.setItem('aib_users', JSON.stringify([])); // The context will populate the current active user here.
}
