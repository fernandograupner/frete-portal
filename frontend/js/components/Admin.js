'use strict';
window.PF = window.PF || {};
PF.Admin = function Admin({token,usuarioAtual}){
  const { useState, useEffect, useCallback } = React;
  const { h, api, brl, Autocomplete } = PF;
  const [tab,setTab]=useState('pedagios');
  const [dados,setDados]=useState([]);
  const [mesos,setMesos]=useState([]);
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState('');
  const [editItem,setEditItem]=useState(null);const [editVal,setEditVal]=useState('');const [editObs,setEditObs]=useState('');
  const [tarifaModal,setTarifaModal]=useState(null);
  const [tarifaForm,setTarifaForm]=useState({meso_id:'',faixa_min:'',faixa_max:'',valor_m3:''});
  const [clienteModal,setClienteModal]=useState(null);
  const [cliForm,setCliForm]=useState({});
  const [cliCityReset,setCliCityReset]=useState(0);
  const [usuarioModal,setUsuarioModal]=useState(null);
  const [usrForm,setUsrForm]=useState({nome:'',login:'',email:'',senha:'',perfil:'user',ativo:true});
  const [confirmDel,setConfirmDel]=useState(null);

  const novoCliente=useCallback(()=>({
    id:null,cnpj:'',codigo:'',loja:'',nome:'',nome_fantasia:'',municipio:'',uf:'PR',
    tipo_frete:'CIF',paletizado:false,dedicado:false,cidade_id:null,ativo:true
  }),[]);

  const buscarCidadesAdmin=useCallback(async q=>{
    const data=await PF.api(`/cidades?busca=${encodeURIComponent(q)}`,{},token);
    return data.dados;
  },[token]);

  useEffect(()=>{
    PF.api('/admin/messorregioes',{},token).then(r=>setMesos(r.dados||[])).catch(()=>setMesos([]));
  },[token]);

  const carregar=useCallback(async()=>{
    setLoading(true);
    try{const data=await PF.api(`/admin/${tab}`,{},token);setDados(data.dados);}
    catch{}
    setLoading(false);
  },[tab,token]);

  useEffect(()=>{carregar();},[carregar]);

  const salvarPedagio=async()=>{
    if(!editItem)return;
    try{
      await PF.api(`/admin/pedagios/${editItem.meso_id}`,{method:'PUT',body:JSON.stringify({valor_por_m3:parseFloat(editVal),observacao:editObs})},token);
      setMsg('Pedágio atualizado!');setEditItem(null);carregar();
    }catch(e){setMsg('Erro: '+e.message);}
  };

  const salvarTarifa=async()=>{
    try{
      if(tarifaModal.mode==='edit'){
        await PF.api(`/admin/tarifas/${tarifaModal.row.id}`,{method:'PUT',body:JSON.stringify({valor_m3:parseFloat(tarifaForm.valor_m3)})},token);
        setMsg('Tarifa atualizada.');
      }else{
        await PF.api('/admin/tarifas',{method:'POST',body:JSON.stringify({
          meso_id:parseInt(tarifaForm.meso_id,10),
          faixa_min:parseFloat(tarifaForm.faixa_min),
          faixa_max:parseFloat(tarifaForm.faixa_max),
          valor_m3:parseFloat(tarifaForm.valor_m3),
        })},token);
        setMsg('Tarifa cadastrada.');
      }
      setTarifaModal(null);carregar();
    }catch(e){setMsg('Erro: '+e.message);}
  };

  const salvarCliente=async()=>{
    try{
      const body={
        cnpj:cliForm.cnpj,codigo:cliForm.codigo,loja:cliForm.loja||null,nome:cliForm.nome,
        nome_fantasia:cliForm.nome_fantasia||null,municipio:cliForm.municipio,uf:String(cliForm.uf||'').toUpperCase().slice(0,2),
        tipo_frete:cliForm.tipo_frete==='FOB'?'FOB':'CIF',
        paletizado:cliForm.paletizado?1:0,dedicado:cliForm.dedicado?1:0,
        cidade_id:cliForm.cidade_id||null,ativo:cliForm.ativo?1:0,
      };
      if(clienteModal.mode==='novo'){
        await PF.api('/admin/clientes',{method:'POST',body:JSON.stringify(body)},token);
        setMsg('Cliente cadastrado.');
      }else{
        await PF.api(`/admin/clientes/${cliForm.id}`,{method:'PUT',body:JSON.stringify(body)},token);
        setMsg('Cliente atualizado.');
      }
      setClienteModal(null);carregar();
    }catch(e){setMsg('Erro: '+e.message);}
  };

  const salvarUsuario=async()=>{
    try{
      if(usuarioModal.mode==='novo'){
        if(!usrForm.senha||usrForm.senha.length<6){setMsg('Erro: informe senha com pelo menos 6 caracteres.');return;}
        await PF.api('/admin/usuarios',{method:'POST',body:JSON.stringify({
          nome:usrForm.nome,login:usrForm.login.trim().toLowerCase(),email:usrForm.email,senha:usrForm.senha,perfil:usrForm.perfil||'user',
        })},token);
        setMsg('Usuário criado.');
      }else{
        await PF.api(`/admin/usuarios/${usuarioModal.row.id}`,{method:'PUT',body:JSON.stringify({
          nome:usrForm.nome,perfil:usrForm.perfil,ativo:usrForm.ativo?1:0,
        })},token);
        setMsg('Usuário atualizado.');
      }
      setUsuarioModal(null);carregar();
    }catch(e){setMsg('Erro: '+e.message);}
  };

  const executarDelete=async()=>{
    if(!confirmDel)return;
    try{
      let path='/admin/';
      if(confirmDel.tipo==='tarifa')path+='tarifas/'+confirmDel.id;
      else if(confirmDel.tipo==='cliente')path+='clientes/'+confirmDel.id;
      else path+='usuarios/'+confirmDel.id;
      const data=await PF.api(path,{method:'DELETE'},token);
      setMsg(data.mensagem||'Concluído.');
      setConfirmDel(null);carregar();
    }catch(e){setMsg('Erro: '+e.message);setConfirmDel(null);}
  };

  const tabNames={pedagios:'Pedágios',tarifas:'Tarifas',clientes:'Clientes',icms:'ICMS',usuarios:'Usuários'};
  let cols=[];
  let bodyRows=[];
  if(tab==='pedagios'){
    cols=['UF','Messorregião','R$/m³','Observação','Ação'];
    bodyRows=dados.map(r=>PF.h('tr',{key:'ped-'+r.id},
      PF.h('td',null,PF.h('span',{className:`uf-tag uf-${String(r.uf).toLowerCase()}`},r.uf)),
      PF.h('td',null,r.meso_nome),PF.h('td',null,PF.h('span',{className:'mono'},PF.brl(r.valor_por_m3))),
      PF.h('td',null,PF.h('span',{style:{fontSize:11,color:'var(--ink3)'}},r.observacao||'—')),
      PF.h('td',{className:'admin-actions'},PF.h('button',{type:'button',className:'btn btn-outline btn-xs',onClick:()=>{setEditItem(r);setEditVal(r.valor_por_m3);setEditObs(r.observacao||'');}},'Editar'))
    ));
  }else if(tab==='tarifas'){
    cols=['UF','Messorregião','Faixa Min','Faixa Max','R$/m³','Ação'];
    bodyRows=dados.map(r=>PF.h('tr',{key:'tar-'+r.id},
      PF.h('td',null,PF.h('span',{className:`uf-tag uf-${String(r.uf).toLowerCase()}`},r.uf)),
      PF.h('td',null,r.meso_nome),PF.h('td',null,PF.h('span',{className:'mono'},`${r.faixa_min} m³`)),
      PF.h('td',null,PF.h('span',{className:'mono'},`${r.faixa_max} m³`)),
      PF.h('td',null,PF.h('span',{className:'mono',style:{fontWeight:600}},PF.brl(r.valor_m3))),
      PF.h('td',{className:'admin-actions'},PF.h('span',{style:{display:'inline-flex',gap:6,flexWrap:'wrap'}},
        PF.h('button',{type:'button',className:'btn btn-outline btn-xs',onClick:()=>{
          setTarifaModal({mode:'edit',row:r});
          setTarifaForm({meso_id:String(r.meso_id),faixa_min:String(r.faixa_min),faixa_max:String(r.faixa_max),valor_m3:String(r.valor_m3)});
        }},'Editar'),
        PF.h('button',{type:'button',className:'btn btn-danger btn-xs',onClick:()=>setConfirmDel({tipo:'tarifa',id:r.id,label:`${r.meso_nome} (${r.faixa_min}–${r.faixa_max} m³)`})},'Encerrar')
      ))
    ));
  }else if(tab==='clientes'){
    cols=['Código','Nome','Município','UF','Palet.','Ded.','Tipo','Ativo','Ação'];
    bodyRows=dados.map(r=>PF.h('tr',{key:'cli-'+r.id,style:{opacity:r.ativo?1:.55}},
      PF.h('td',null,PF.h('span',{className:'mono'},r.codigo)),
      PF.h('td',null,r.nome_fantasia||r.nome),
      PF.h('td',null,r.municipio),
      PF.h('td',null,PF.h('span',{className:`uf-tag uf-${String(r.uf).toLowerCase()}`},r.uf)),
      PF.h('td',null,r.paletizado?PF.h('span',{className:'chip chip-blue'},'Sim'):PF.h('span',{className:'chip chip-gray'},'Não')),
      PF.h('td',null,r.dedicado?PF.h('span',{className:'chip chip-teal'},'Sim'):PF.h('span',{className:'chip chip-gray'},'Não')),
      PF.h('td',null,PF.h('span',{className:`chip ${r.tipo_frete==='CIF'?'chip-green':'chip-amber'}`},r.tipo_frete)),
      PF.h('td',null,r.ativo?PF.h('span',{className:'chip chip-green'},'Sim'):PF.h('span',{className:'chip chip-gray'},'Não')),
      PF.h('td',{className:'admin-actions'},PF.h('span',{style:{display:'inline-flex',gap:6,flexWrap:'wrap'}},
        PF.h('button',{type:'button',className:'btn btn-outline btn-xs',onClick:()=>{
          setClienteModal({mode:'edit'});
          setCliForm({
            id:r.id,cnpj:r.cnpj,codigo:r.codigo,loja:r.loja||'',nome:r.nome,nome_fantasia:r.nome_fantasia||'',
            municipio:r.municipio,uf:r.uf,tipo_frete:r.tipo_frete,paletizado:!!r.paletizado,dedicado:!!r.dedicado,
            cidade_id:r.cidade_id,ativo:!!r.ativo,
          });
          setCliCityReset(k=>k+1);
        }},'Editar'),
        PF.h('button',{type:'button',className:'btn btn-danger btn-xs',onClick:()=>setConfirmDel({tipo:'cliente',id:r.id,label:r.nome_fantasia||r.nome})},'Remover')
      ))
    ));
  }else if(tab==='icms'){
    cols=['UF','Alíquota','Observação'];
    bodyRows=dados.map(r=>PF.h('tr',{key:'icms-'+r.uf},
      PF.h('td',null,PF.h('span',{className:`uf-tag uf-${String(r.uf).toLowerCase()}`},r.uf)),
      PF.h('td',null,PF.h('span',{className:'mono',style:{fontWeight:600}},(r.aliquota*100).toFixed(0)+'%')),PF.h('td',null,r.observacao)
    ));
  }else if(tab==='usuarios'){
    cols=['Nome','Usuário','E-mail','Perfil','Ativo','Ação'];
    bodyRows=dados.map(r=>{
      const souEu=Number(r.id)===Number(usuarioAtual?.id);
      return PF.h('tr',{key:'usr-'+r.id},
        PF.h('td',null,r.nome),
        PF.h('td',null,PF.h('span',{className:'mono',style:{fontSize:12}},r.login||'—')),
        PF.h('td',null,PF.h('span',{className:'mono',style:{fontSize:12}},r.email)),
        PF.h('td',null,PF.h('span',{className:`chip ${r.perfil==='admin'?'chip-amber':'chip-gray'}`},r.perfil)),
        PF.h('td',null,r.ativo?PF.h('span',{className:'chip chip-green'},'Ativo'):PF.h('span',{className:'chip chip-gray'},'Inativo')),
        PF.h('td',{className:'admin-actions'},PF.h('span',{style:{display:'inline-flex',gap:6,flexWrap:'wrap'}},
          PF.h('button',{type:'button',className:'btn btn-outline btn-xs',disabled:souEu,title:souEu?'Este usuário é você':'',
            onClick:()=>{
              setUsuarioModal({mode:'edit',row:r});
              setUsrForm({nome:r.nome,login:r.login||'',email:r.email,senha:'',perfil:r.perfil,ativo:!!r.ativo});
            }},'Editar'),
          PF.h('button',{type:'button',className:'btn btn-danger btn-xs',disabled:souEu,title:souEu?'':'Remover usuário',
            onClick:()=>setConfirmDel({tipo:'usuario',id:r.id,label:r.nome})},'Remover')
        ))
      );
    });
  }

  const toolbar=PF.h('div',{className:'admin-toolbar'},
    tab==='tarifas'&&PF.h('button',{type:'button',className:'btn btn-primary btn-sm',onClick:()=>{
      setTarifaModal({mode:'novo'});
      setTarifaForm({meso_id:mesos[0]?String(mesos[0].id):'',faixa_min:'',faixa_max:'',valor_m3:''});
    }},'+ Nova tarifa'),
    tab==='clientes'&&PF.h('button',{type:'button',className:'btn btn-primary btn-sm',onClick:()=>{
      setClienteModal({mode:'novo'});
      setCliForm(novoCliente());
      setCliCityReset(k=>k+1);
    }},'+ Novo cliente'),
    tab==='usuarios'&&PF.h('button',{type:'button',className:'btn btn-primary btn-sm',onClick:()=>{
      setUsuarioModal({mode:'novo'});
      setUsrForm({nome:'',login:'',email:'',senha:'',perfil:'user',ativo:true});
    }},'+ Novo usuário')
  );

  return PF.h('div',{className:'page-wrap'},
    PF.h('div',{className:'page-header'},PF.h('span',{className:'page-title'},'Painel Administrativo')),
    PF.h('div',{className:'erp-tab-row'},
      Object.keys(tabNames).map(t=>PF.h('button',{key:t,type:'button',className:`btn btn-sm erp-tab ${tab===t?'btn-primary':'btn-outline'}`,onClick:()=>{setTab(t);setMsg('');}},tabNames[t]))
    ),
    msg&&PF.h('div',{className:`alert ${msg.startsWith('Erro')?'alert-error':'alert-success'}`},msg),
    toolbar,
    loading?PF.h('div',{className:'loading-row'},PF.h('div',{className:'spin'}),'Carregando…')
    :PF.h('div',{className:'card erp-card'},
      PF.h('table',{className:'tbl tbl-erp'},
        PF.h('thead',null,PF.h('tr',null,cols.map(c=>PF.h('th',{key:c},c)))),
        PF.h('tbody',null,bodyRows.length?bodyRows:[PF.h('tr',{key:'empty'},PF.h('td',{colSpan:Math.max(cols.length,1),className:'tbl-empty'},'Nenhum registro encontrado.'))])
      )
    ),
    editItem&&PF.h('div',{className:'modal-bg',onClick:e=>{if(e.target===e.currentTarget)setEditItem(null)}},
      PF.h('div',{className:'modal-box'},
        PF.h('div',{className:'modal-title'},`Editar Pedágio — ${editItem.meso_nome}`),
        PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Valor por m³ (R$)'),PF.h('input',{type:'number',step:'.01',value:editVal,onChange:e=>setEditVal(e.target.value)})),
        PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Observação'),PF.h('input',{type:'text',value:editObs,onChange:e=>setEditObs(e.target.value)})),
        PF.h('div',{className:'modal-footer'},PF.h('button',{type:'button',className:'btn btn-ghost',onClick:()=>setEditItem(null)},'Cancelar'),PF.h('button',{type:'button',className:'btn btn-primary',onClick:salvarPedagio},'Salvar'))
      )
    ),
    tarifaModal&&PF.h('div',{className:'modal-bg',onClick:e=>{if(e.target===e.currentTarget)setTarifaModal(null)}},
      PF.h('div',{className:'modal-box'},
        PF.h('div',{className:'modal-title'},tarifaModal.mode==='edit'?'Editar tarifa (vigência atual)':'Nova tarifa por faixa'),
        PF.h('div',{className:'modal-scroll'},
          tarifaModal.mode==='edit'&&PF.h('div',{style:{fontSize:12,color:'var(--ink3)',marginBottom:12}},
            `${tarifaModal.row.meso_nome} · Faixa ${tarifaModal.row.faixa_min} – ${tarifaModal.row.faixa_max} m³`),
          tarifaModal.mode==='novo'&&PF.h('div',null,
            PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Messorregião'),
              PF.h('select',{value:tarifaForm.meso_id,onChange:e=>setTarifaForm(f=>({...f,meso_id:e.target.value}))},
                mesos.map(m=>PF.h('option',{key:m.id,value:String(m.id)},`${m.uf} — ${m.nome}`)))),
            PF.h('div',{className:'field-row'},
              PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Faixa mín (m³)'),PF.h('input',{type:'number',step:'.01',value:tarifaForm.faixa_min,onChange:e=>setTarifaForm(f=>({...f,faixa_min:e.target.value}))})),
              PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Faixa máx (m³)'),PF.h('input',{type:'number',step:'.01',value:tarifaForm.faixa_max,onChange:e=>setTarifaForm(f=>({...f,faixa_max:e.target.value}))}))
            )),
          PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Valor R$/m³'),PF.h('input',{type:'number',step:'.0001',value:tarifaForm.valor_m3,onChange:e=>setTarifaForm(f=>({...f,valor_m3:e.target.value}))})),
          tarifaModal.mode==='novo'&&PF.h('p',{style:{fontSize:11,color:'var(--ink3)',marginTop:10}},'Se já existir mesma meso + faixa na vigência atual, o registro anterior será encerrado.')
        ),
        PF.h('div',{className:'modal-footer'},PF.h('button',{type:'button',className:'btn btn-ghost',onClick:()=>setTarifaModal(null)},'Cancelar'),PF.h('button',{type:'button',className:'btn btn-primary',onClick:salvarTarifa},'Salvar'))
      )
    ),
    clienteModal&&PF.h('div',{className:'modal-bg',onClick:e=>{if(e.target===e.currentTarget)setClienteModal(null)}},
      PF.h('div',{className:'modal-box',style:{maxWidth:460}},
        PF.h('div',{className:'modal-title'},clienteModal.mode==='novo'?'Novo cliente':'Editar cliente'),
        PF.h('div',{className:'modal-scroll'},
          PF.h('div',{className:'field-row'},
            PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'CNPJ'),PF.h('input',{value:cliForm.cnpj||'',onChange:e=>setCliForm(f=>({...f,cnpj:e.target.value}))})),
            PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Código'),PF.h('input',{value:cliForm.codigo||'',onChange:e=>setCliForm(f=>({...f,codigo:e.target.value}))}))
          ),
          PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Loja'),PF.h('input',{value:cliForm.loja||'',onChange:e=>setCliForm(f=>({...f,loja:e.target.value}))})),
          PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Razão social'),PF.h('input',{value:cliForm.nome||'',onChange:e=>setCliForm(f=>({...f,nome:e.target.value}))})),
          PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Nome fantasia'),PF.h('input',{value:cliForm.nome_fantasia||'',onChange:e=>setCliForm(f=>({...f,nome_fantasia:e.target.value}))})),
          PF.h('div',{className:'field-row'},
            PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Município'),PF.h('input',{value:cliForm.municipio||'',onChange:e=>setCliForm(f=>({...f,municipio:e.target.value}))})),
            PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'UF'),PF.h('input',{maxLength:2,placeholder:'PR',value:cliForm.uf||'',onChange:e=>setCliForm(f=>({...f,uf:e.target.value.toUpperCase()}))}))
          ),
          h(Autocomplete,{label:'Cidade cadastro (opcional)',placeholder:'Buscar cidade…',resetKey:cliCityReset,buscar:buscarCidadesAdmin,
            getLabel:c=>`${c.nome} / ${c.uf}`,
            renderItem:c=>PF.h('div',null,PF.h('div',{className:'ac-main'},`${c.nome} / ${c.uf}`),PF.h('div',{className:'ac-sub'},c.meso_nome||'')),
            onSelect:c=>setCliForm(f=>({...f,cidade_id:c.id,municipio:c.nome,uf:c.uf}))}),
          PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Tipo frete'),
            PF.h('select',{value:cliForm.tipo_frete||'CIF',onChange:e=>setCliForm(f=>({...f,tipo_frete:e.target.value}))},
              PF.h('option',{value:'CIF'},'CIF'),PF.h('option',{value:'FOB'},'FOB'))),
          PF.h('div',{className:'field-row'},
            PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Paletizado'),PF.h('select',{value:cliForm.paletizado?'1':'0',onChange:e=>setCliForm(f=>({...f,paletizado:e.target.value==='1'}))},PF.h('option',{value:'0'},'Não'),PF.h('option',{value:'1'},'Sim'))),
            PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Dedicado'),PF.h('select',{value:cliForm.dedicado?'1':'0',onChange:e=>setCliForm(f=>({...f,dedicado:e.target.value==='1'}))},PF.h('option',{value:'0'},'Não'),PF.h('option',{value:'1'},'Sim')))
          ),
          PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Ativo'),PF.h('select',{value:cliForm.ativo?'1':'0',onChange:e=>setCliForm(f=>({...f,ativo:e.target.value==='1'}))},PF.h('option',{value:'1'},'Sim'),PF.h('option',{value:'0'},'Não')))
        ),
        PF.h('div',{className:'modal-footer'},PF.h('button',{type:'button',className:'btn btn-ghost',onClick:()=>setClienteModal(null)},'Cancelar'),PF.h('button',{type:'button',className:'btn btn-primary',onClick:salvarCliente},'Salvar'))
      )
    ),
    usuarioModal&&PF.h('div',{className:'modal-bg',onClick:e=>{if(e.target===e.currentTarget)setUsuarioModal(null)}},
      PF.h('div',{className:'modal-box'},
        PF.h('div',{className:'modal-title'},usuarioModal.mode==='novo'?'Novo usuário':'Editar usuário'),
        PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Nome'),PF.h('input',{value:usrForm.nome,onChange:e=>setUsrForm(f=>({...f,nome:e.target.value}))})),
        usuarioModal.mode==='novo'&&PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Usuário (login)'),PF.h('input',{type:'text',autoCapitalize:'none',spellCheck:false,placeholder:'ex.: maria.silva',value:usrForm.login,onChange:e=>setUsrForm(f=>({...f,login:e.target.value}))})),
        usuarioModal.mode==='edit'&&PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Usuário'),PF.h('input',{type:'text',disabled:true,value:usrForm.login})),
        PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'E-mail'),PF.h('input',{type:'email',disabled:usuarioModal.mode==='edit',value:usrForm.email,onChange:e=>setUsrForm(f=>({...f,email:e.target.value}))})),
        usuarioModal.mode==='novo'&&PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Senha inicial'),PF.h('input',{type:'password',placeholder:'mín. 6 caracteres',value:usrForm.senha,onChange:e=>setUsrForm(f=>({...f,senha:e.target.value}))})),
        PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Perfil'),
          PF.h('select',{value:usrForm.perfil,onChange:e=>setUsrForm(f=>({...f,perfil:e.target.value}))},PF.h('option',{value:'user'},'Usuário'),PF.h('option',{value:'admin'},'Administrador'))),
        usuarioModal.mode==='edit'&&PF.h('div',{className:'field'},PF.h('label',{className:'field-label'},'Ativo'),PF.h('select',{value:usrForm.ativo?'1':'0',onChange:e=>setUsrForm(f=>({...f,ativo:e.target.value==='1'}))},PF.h('option',{value:'1'},'Sim'),PF.h('option',{value:'0'},'Não'))),
        PF.h('div',{className:'modal-footer'},PF.h('button',{type:'button',className:'btn btn-ghost',onClick:()=>setUsuarioModal(null)},'Cancelar'),PF.h('button',{type:'button',className:'btn btn-primary',onClick:salvarUsuario},'Salvar'))
      )
    ),
    confirmDel&&PF.h('div',{className:'modal-bg',onClick:e=>{if(e.target===e.currentTarget)setConfirmDel(null)}},
      PF.h('div',{className:'modal-box'},
        PF.h('div',{className:'modal-title'},'Confirmar'),
        PF.h('p',{style:{fontSize:13,color:'var(--ink2)',lineHeight:1.5}},
          confirmDel.tipo==='tarifa'?'Encerrar vigência desta tarifa? Ela some da lista atual.'
          :confirmDel.tipo==='cliente'?'Remover este cliente? Se houver cálculos no histórico, ele será apenas desativado.'
          :'Remover este usuário? Se houver cálculos, será apenas desativado.'),
        PF.h('p',{style:{fontWeight:600,marginTop:8}},confirmDel.label),
        PF.h('div',{className:'modal-footer'},PF.h('button',{type:'button',className:'btn btn-ghost',onClick:()=>setConfirmDel(null)},'Cancelar'),PF.h('button',{type:'button',className:'btn btn-danger',onClick:executarDelete},'Confirmar'))
      )
    )
  );
}

