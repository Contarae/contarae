import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import AdminPanel from "./AdminPanel";

const WA="573013101050",WL=`https://wa.me/${WA}`,EM="info@contarae.com",F="'Outfit',sans-serif",FH="'Libre Baskerville',serif";
const fm=n=>new Intl.NumberFormat("es-CO").format(n);
const wm=m=>`${WL}?text=${encodeURIComponent(m)}`;
const WK="pub_prod_aEMHipEJ29G4pZOiIwgRC1GOvbqIYzP6";
const fmtI=v=>{const n=v.replace(/\D/g,"");return n?"$ "+fm(parseInt(n)):""};
const pN=v=>parseInt(v.replace(/\D/g,""))||0;
const gT=t=>{if(t<=2e6)return 1500;if(t<=4e6)return 100000;if(t<=7e6)return 120000;if(t<=12e6)return 150000;if(t<=20e6)return 180000;return 200000};
const disc=v=>Math.round(v/.75);
const SUPPORT_MAX_FILES=5;
const SUPPORT_MAX_BYTES=6*1024*1024;
const SUPPORT_ACCEPT=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx";
const SUPPORT_ALLOWED_TYPES=new Set(["application/pdf","image/jpeg","image/png","image/webp","image/heic","image/heif","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const fmtB=bytes=>{const n=Number(bytes||0);if(!Number.isFinite(n)||n<=0)return"0 B";if(n<1024)return`${n} B`;if(n<1024*1024)return`${(n/1024).toFixed(1)} KB`;return`${(n/(1024*1024)).toFixed(1)} MB`;};
const CERT_ROUTE="/certificacion";
const CERT_ROUTE_ALIASES=new Set([CERT_ROUTE,"/certificacion-de-ingresos"]);
const ADMIN_ROUTE="/admin/certificaciones";
const ADMIN_ROUTE_ALIASES=new Set([ADMIN_ROUTE,"/admin"]);
const OPEN_CERT_FORM_EVENT="contarae:open-certification-form";
const normPath=p=>{if(!p)return"/";const c=p.replace(/\/+$/,"");return c||"/";};
const isCertificationPath=p=>CERT_ROUTE_ALIASES.has(normPath(p));
const isAdminPath=p=>ADMIN_ROUTE_ALIASES.has(normPath(p));
const getCurrentPath=()=>typeof window==="undefined"?"/":normPath(window.location.pathname);
const getSectionHref=(id,path)=>isCertificationPath(path)&&id!=="certificacion"?`/#${id}`:`#${id}`;
const scrollToId=(id,behavior="smooth")=>{if(typeof window==="undefined")return false;const el=document.getElementById(id);if(!el)return false;const top=el.getBoundingClientRect().top+window.pageYOffset-156;window.scrollTo({top,behavior});return true;};
const openCertificationForm=()=>{if(typeof window==="undefined")return;window.dispatchEvent(new CustomEvent(OPEN_CERT_FORM_EVENT));};

const CITIES=["Bogotá D.C.","Medellín","Cali","Barranquilla","Cartagena","Cúcuta","Bucaramanga","Pereira","Santa Marta","Ibagué","Pasto","Manizales","Neiva","Villavicencio","Armenia","Valledupar","Montería","Sincelejo","Popayán","Tunja","Florencia","Riohacha","Quibdó","Yopal","Mocoa","Arauca","Leticia","Inírida","Mitú","Puerto Carreño","San José del Guaviare","San Andrés","Buenaventura","Soacha","Bello","Soledad","Itagüí","Envigado","Palmira","Floridablanca","Dosquebradas","Tulúa","Barrancabermeja","Maicao","Girardot","Zipaquirá","Facatativá","Chía","Fusagasugá","Tuluá","Sogamoso","Duitama","Girón","Piedecuesta","Apartadó","Turbo","Lorica","Magangué","Aguachica","Ocaña","Pamplona","Ciénaga","Fundación","Cartago","Buga","Tumaco","Ipiales","Sabaneta","La Estrella","Copacabana","Rionegro","Cajicá","Mosquera","Madrid","Funza"];

function LogoNav(){
  return(
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{position:"relative"}}>
        <div style={{
          position:"absolute",
          inset:-10,
          borderRadius:"50%",
          background:"radial-gradient(circle, rgba(96,165,250,.18) 0%, rgba(96,165,250,0) 72%)",
          filter:"blur(10px)"
        }}/>
        <svg width="32" height="40" viewBox="0 0 32 40" style={{position:"relative"}}>
          <path d="M16 0 L32 10 L32 30 L16 40 L0 30 L0 10 Z" fill="#10233F" stroke="#3B82F6" strokeWidth="1.5"/>
          <path d="M16 4 L28 11 L28 29 L16 36 L4 29 L4 11 Z" fill="none" stroke="#93C5FD" strokeWidth=".8" opacity=".55"/>
          <text x="16" y="27" textAnchor="middle" fontFamily="Georgia,serif" fontSize="20" fill="#fff" fontWeight="700">C</text>
        </svg>
      </div>
      <div>
        <div style={{display:"flex"}}>
          <span style={{fontFamily:FH,fontSize:21,fontWeight:700,color:"#F8FBFF",letterSpacing:"1.5px"}}>CONTA</span>
          <span style={{fontFamily:FH,fontSize:21,fontWeight:700,color:"#7DD3FC",letterSpacing:"1.5px"}}>RAE</span>
        </div>
        <div style={{fontSize:8.5,color:"rgba(226,232,240,.82)",letterSpacing:"2.2px",fontFamily:F,marginTop:1}}>
          SERVICIOS CONTABLES, TRIBUTARIOS Y FINANCIEROS
        </div>
      </div>
    </div>
  );
}
function LogoFt(){return(<div style={{display:"flex",alignItems:"center",gap:11,justifyContent:"center",marginBottom:14}}><svg width="38" height="46" viewBox="0 0 56 64"><path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z" fill="#1B3A5C" stroke="#2563EB" strokeWidth="2.5"/><path d="M28 6 L50 19 L50 45 L28 58 L6 45 L6 19 Z" fill="none" stroke="#60A5FA" strokeWidth="1.2" opacity=".5"/><text x="28" y="42" textAnchor="middle" fontFamily="Georgia,serif" fontSize="34" fill="#fff" fontWeight="700">C</text></svg><div><div style={{display:"flex"}}><span style={{fontFamily:FH,fontSize:22,fontWeight:700,color:"#fff",letterSpacing:"2px"}}>CONTA</span><span style={{fontFamily:FH,fontSize:22,fontWeight:700,color:"#60A5FA",letterSpacing:"2px"}}>RAE</span></div><div style={{height:1.5,background:"#60A5FA",opacity:.5,marginTop:3,marginBottom:5,borderRadius:2}}/><div style={{fontSize:8,color:"rgba(255,255,255,.75)",letterSpacing:"2.8px",fontFamily:F}}>SERVICIOS CONTABLES, TRIBUTARIOS Y FINANCIEROS</div></div></div>)}

const B=["#F8FBFF","#FFFFFF","#F2F7FE","#FBFDFF","#EFF5FC","#FFFFFF","#F3F8FF","#F8FBFF"];
const SUB_BG=["#FBFDFF","#F3F7FD","#EAF2FB"];
const IS={width:"100%",padding:"12px 14px",borderRadius:9,border:"1px solid #d0d9e8",fontSize:15,fontFamily:F,outline:"none",background:"#fff",boxSizing:"border-box"};
const AUTO_IS={...IS,background:"#F3F4F6",color:"#475569"};
const NOTE_BOX={padding:"12px 14px",borderRadius:12,background:"rgba(15,23,42,.03)",border:"1px solid rgba(37,99,235,.10)",fontSize:12,color:"#64748B",lineHeight:1.7,fontFamily:F};
const PANEL={padding:24,borderRadius:18,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 10px 30px rgba(15,23,42,.05)"};
const BLOCK={padding:18,borderRadius:16,background:"#F8FBFF",border:"1px solid rgba(37,99,235,.10)"};
const cop=v=>`COP $ ${fm(Math.round(v||0))}`;
const fspRate=(base,smlmv)=>{const s=(base||0)/smlmv; if(s<4)return 0; if(s<16)return .01; if(s<17)return .012; if(s<18)return .014; if(s<19)return .016; if(s<20)return .018; return .02;};
const riskRates={1:.00522,2:.01044,3:.02436,4:.0435,5:.0696};
const riskLabels={1:"Riesgo I (0,522%)",2:"Riesgo II (1,044%)",3:"Riesgo III (2,436%)",4:"Riesgo IV (4,350%)",5:"Riesgo V (6,960%)"};
const yearlyCaps={rent25:790/12,max40:1340/12,volAfc:3800/12};
const Sec=({id,title,sub,bg,children,narrow})=>(<section id={id} style={{padding:"72px 24px 64px",background:bg||"transparent",scrollMarginTop:"145px",position:"relative"}}><div style={{maxWidth:narrow?940:1140,margin:"0 auto"}}>{title&&<div style={{textAlign:"center",margin:"0 auto 34px",maxWidth:820}}>{sub&&<div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"7px 14px",borderRadius:999,background:"rgba(37,99,235,.06)",border:"1px solid rgba(37,99,235,.10)",fontSize:11,fontWeight:700,color:"#2563EB",letterSpacing:"1.8px",marginBottom:12,fontFamily:F,boxShadow:"0 8px 20px rgba(37,99,235,.05)"}}><span style={{width:18,height:1.5,background:"linear-gradient(90deg, rgba(37,99,235,.10), rgba(37,99,235,.45))",borderRadius:999}}/>{sub}<span style={{width:18,height:1.5,background:"linear-gradient(90deg, rgba(37,99,235,.45), rgba(37,99,235,.10))",borderRadius:999}}/></div>}<h2 style={{fontFamily:FH,fontSize:"clamp(28px,3.8vw,42px)",fontWeight:700,color:"#0B1D3A",lineHeight:1.08,margin:"0 auto",maxWidth:760,textWrap:"balance"}}>{title}</h2><div style={{width:92,height:3,borderRadius:999,margin:"16px auto 0",background:"linear-gradient(90deg, rgba(37,99,235,.08), rgba(37,99,235,.38), rgba(56,189,248,.26), rgba(37,99,235,.08))",boxShadow:"0 4px 14px rgba(37,99,235,.08)"}}/></div>}{children}</div></section>);
const Cd=({children,s,...props})=><div {...props} className="card-glow-shell" style={{padding:24,borderRadius:20,background:"transparent",border:"1px solid rgba(96,165,250,.22)",boxShadow:"0 18px 42px rgba(15,23,42,.07), 0 0 0 1px rgba(255,255,255,.55) inset",backdropFilter:"blur(10px)",scrollMarginTop:"136px",transition:"transform .34s ease,box-shadow .34s ease,border-color .34s ease, filter .34s ease",position:"relative",overflow:"hidden",isolation:"isolate",...s}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-7px) scale(1.022)";e.currentTarget.style.boxShadow="0 26px 56px rgba(37,99,235,.16), 0 0 0 1px rgba(96,165,250,.34) inset, 0 0 24px rgba(96,165,250,.12)";e.currentTarget.style.borderColor="rgba(96,165,250,.34)";const g=e.currentTarget.querySelector('.card-glow-ring');if(g)g.style.opacity="1";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0) scale(1)";e.currentTarget.style.boxShadow="0 18px 42px rgba(15,23,42,.07), 0 0 0 1px rgba(255,255,255,.55) inset";e.currentTarget.style.borderColor="rgba(96,165,250,.22)";const g=e.currentTarget.querySelector('.card-glow-ring');if(g)g.style.opacity=".62";}}><div className="card-glow-ring" style={{position:"absolute",inset:-1,borderRadius:20,background:"linear-gradient(120deg, rgba(37,99,235,0) 0%, rgba(56,189,248,.55) 18%, rgba(255,255,255,.95) 32%, rgba(59,130,246,.42) 48%, rgba(37,99,235,0) 62%, rgba(125,211,252,.32) 78%, rgba(37,99,235,0) 100%)",backgroundSize:"220% 220%",animation:"cardGlowFlow 7.2s linear infinite",opacity:.62,filter:"blur(1px)"}}/><div style={{position:"absolute",inset:1.2,borderRadius:18.5,background:"linear-gradient(180deg, rgba(255,255,255,.985), rgba(255,255,255,.94))",zIndex:0}}/><div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:"linear-gradient(90deg, rgba(37,99,235,0), rgba(96,165,250,.44), rgba(56,189,248,.35), rgba(37,99,235,0))",zIndex:1}}/><div style={{position:"relative",zIndex:2}}>{children}</div></div>;

/* NAV WITH DROPDOWNS + ACTIVE */

function Nav({path}){
  const[op,sO]=useState(false);
  const[act,sAct]=useState(isCertificationPath(path)?"certificacion":"inicio");
  const[dd,sDD]=useState(null);
  const certRoute=isCertificationPath(path);

  const menu=[
    {l:"Inicio",id:"inicio"},
    {l:"Servicios",id:"servicios",sub:[{l:"Servicios generales",id:"servicios"},{l:"Planes contables",id:"planes"},{l:"Escenarios frecuentes",id:"escenarios"},{l:"Trámites contables",id:"tramites"}]},
    {l:"Certificación",id:"certificacion"},
    {l:"Herramientas",id:"herramientas",sub:[{l:"Introducción herramientas",id:"herramientas"},{l:"¿Debo declarar renta?",id:"tool-renta"},{l:"Retención en la fuente",id:"tool-retencion"},{l:"Planilla independientes",id:"tool-planilla"},{l:"Liquidador de nómina",id:"tool-nomina"},{l:"Liquidador de IVA",id:"tool-iva"},{l:"Precio antes de IVA",id:"tool-precio"},{l:"Calendario tributario",id:"calendario"}]},
    {l:"Recursos",id:"blog",sub:[{l:"Blog",id:"blog"},{l:"Descargas",id:"descargas"},{l:"Preguntas frecuentes",id:"faq"},{l:"Alertas tributarias",id:"alertas"}]},
    {l:"Nosotros",id:"whyus",sub:[{l:"¿Por qué elegirnos?",id:"whyus"},{l:"Sobre CONTARAE",id:"nosotros"}]},
    {l:"Contacto",id:"contacto",sub:[{l:"Contacto",id:"contacto"}]}
  ];

  useEffect(()=>{
    if(certRoute){
      sAct("certificacion");
      return;
    }
    const ids=["inicio","servicios","planes","escenarios","tramites","certificacion","herramientas","tool-renta","tool-retencion","tool-planilla","tool-nomina","tool-iva","tool-precio","calendario","blog","descargas","faq","alertas","whyus","nosotros","contacto"];
    const obs=new IntersectionObserver(en=>{
      en.forEach(e=>{
        if(e.isIntersecting)sAct(e.target.id);
      });
    },{threshold:.15,rootMargin:"-80px 0px"});

    ids.forEach(id=>{
      const el=document.getElementById(id);
      if(el)obs.observe(el);
    });

    return()=>obs.disconnect();
  },[certRoute]);

  const navBase={
    textDecoration:"none",
    fontSize:13,
    fontFamily:F,
    padding:"8px 13px",
    borderRadius:999,
    transition:"all .22s ease",
    display:"inline-flex",
    alignItems:"center",
    gap:6
  };

  const goTo=id=>e=>{
    if(certRoute&&id!=="certificacion"){
      sDD(null);
      sO(false);
      return;
    }
    const el=document.getElementById(id);
    if(!el)return;
    e.preventDefault();
    scrollToId(id);
    sAct(id);
    sDD(null);
    sO(false);
    if(window.history?.replaceState)window.history.replaceState(null,"",`${window.location.pathname}${window.location.search}#${id}`);
  };

  return(
    <nav style={{
      position:"fixed",
      top:0,
      width:"100%",
      zIndex:200,
      padding:"14px 24px",
      display:"flex",
      alignItems:"center",
      justifyContent:"space-between",
      background:"linear-gradient(135deg, rgba(9,21,41,.95), rgba(15,39,73,.93) 55%, rgba(17,51,92,.94))",
      backdropFilter:"blur(16px)",
      WebkitBackdropFilter:"blur(16px)",
      borderBottom:"1px solid rgba(125,211,252,.16)",
      boxShadow:"0 12px 38px rgba(2,8,23,.26)"
    }}>
      <style>{`
        @keyframes navShine{
          0%{background-position:0% 50%;opacity:.88}
          50%{background-position:100% 50%;opacity:1}
          100%{background-position:0% 50%;opacity:.88}
        }
      `}</style>

      <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"linear-gradient(90deg, rgba(255,255,255,.03), rgba(255,255,255,0) 18%, rgba(125,211,252,.04) 45%, rgba(255,255,255,0) 72%, rgba(255,255,255,.02))"}}/>
      <LogoNav/>

      <div style={{display:"flex",gap:5,alignItems:"center",position:"relative"}} className="dk">
        {menu.map((m,i)=>
          <div
            key={i}
            style={{position:"relative",paddingBottom:9,marginBottom:-9}}
            onMouseEnter={()=>m.sub&&sDD(i)}
            onMouseLeave={()=>sDD(null)}
          >
            <a
              href={getSectionHref(m.id,path)}
              onClick={goTo(m.id)}
              style={{
                ...navBase,
                color:act===m.id?"#F8FBFF":"rgba(226,232,240,.84)",
                fontWeight:act===m.id?700:500,
                background:act===m.id?"linear-gradient(135deg, rgba(37,99,235,.42), rgba(14,165,233,.28))":"transparent",
                border:act===m.id?"1px solid rgba(125,211,252,.30)":"1px solid transparent",
                boxShadow:act===m.id?"0 8px 20px rgba(37,99,235,.18)":"none"
              }}
              onMouseEnter={e=>{
                if(act!==m.id){
                  e.currentTarget.style.background="rgba(255,255,255,.05)";
                  e.currentTarget.style.color="#F8FBFF";
                  e.currentTarget.style.border="1px solid rgba(125,211,252,.18)";
                }
              }}
              onMouseLeave={e=>{
                if(act!==m.id){
                  e.currentTarget.style.background="transparent";
                  e.currentTarget.style.color="rgba(226,232,240,.84)";
                  e.currentTarget.style.border="1px solid transparent";
                }
              }}
            >
              {m.l}{m.sub?" ▾":""}
            </a>

            {m.sub&&dd===i&&
              <div style={{
                position:"absolute",
                top:"calc(100% - 2px)",
                left:0,
                background:"linear-gradient(180deg, rgba(8,18,36,.985), rgba(10,24,45,.985))",
                border:"1px solid rgba(125,211,252,.18)",
                borderRadius:14,
                padding:"10px 0",
                minWidth:230,
                marginTop:0,
                boxShadow:"0 18px 40px rgba(2,8,23,.34)",
                overflow:"hidden",
                zIndex:300
              }}>
                <div style={{position:"absolute",top:0,left:0,width:"100%",height:1,background:"linear-gradient(90deg, rgba(125,211,252,0), rgba(125,211,252,.35), rgba(125,211,252,0))"}}/>
                {m.sub.map((s,j)=>
                  <a
                    key={j}
                    href={getSectionHref(s.id,path)}
                    onClick={goTo(s.id)}
                    style={{
                      display:"block",
                      padding:"11px 18px",
                      color:"rgba(226,232,240,.82)",
                      fontSize:13,
                      fontFamily:F,
                      textDecoration:"none",
                      transition:"background .2s,color .2s,padding-left .2s"
                    }}
                    onMouseEnter={e=>{
                      e.target.style.background="rgba(37,99,235,.16)";
                      e.target.style.color="#F8FBFF";
                      e.target.style.paddingLeft="22px";
                    }}
                    onMouseLeave={e=>{
                      e.target.style.background="transparent";
                      e.target.style.color="rgba(226,232,240,.82)";
                      e.target.style.paddingLeft="18px";
                    }}
                  >
                    {s.l}
                  </a>
                )}
              </div>
            }
          </div>
        )}

        <a
          href={wm("Hola CONTARAE, me gustaría recibir asesoría sobre sus servicios contables.")}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding:"8px 16px",
            borderRadius:11,
            background:"linear-gradient(135deg,#2563EB,#38BDF8)",
            color:"#fff",
            fontSize:13,
            fontWeight:700,
            textDecoration:"none",
            marginLeft:8,
            boxShadow:"0 10px 24px rgba(37,99,235,.25)",
            border:"1px solid rgba(191,219,254,.18)"
          }}
        >
          WhatsApp
        </a>
      </div>

      <button
        onClick={()=>sO(!op)}
        className="hm"
        style={{background:"none",border:"none",cursor:"pointer",padding:6,display:"none"}}
        aria-label="Menú"
      >
        <div style={{width:24,height:2.5,background:"#fff",marginBottom:5,borderRadius:99,transition:"all .3s",transform:op?"rotate(45deg) translate(5px,5px)":"none"}}/>
        <div style={{width:24,height:2.5,background:"#fff",marginBottom:5,borderRadius:99,opacity:op?0:1}}/>
        <div style={{width:24,height:2.5,background:"#fff",borderRadius:99,transition:"all .3s",transform:op?"rotate(-45deg) translate(5px,-5px)":"none"}}/>
      </button>

      {op&&
        <div style={{
          position:"absolute",
          top:"100%",
          left:0,
          width:"100%",
          background:"linear-gradient(180deg, rgba(8,18,36,.985), rgba(10,24,45,.985))",
          padding:"18px 24px",
          borderBottom:"1px solid rgba(125,211,252,.12)",
          maxHeight:"80vh",
          overflowY:"auto",
          boxShadow:"0 18px 40px rgba(2,8,23,.34)"
        }}>
          {menu.map((m,i)=>
            <div key={i}>
              <a
                href={getSectionHref(m.id,path)}
                onClick={goTo(m.id)}
                style={{
                  display:"block",
                  padding:"13px 0",
                  color:act===m.id?"#F8FBFF":"rgba(226,232,240,.82)",
                  fontSize:16,
                  fontWeight:act===m.id?700:500,
                  fontFamily:F,
                  textDecoration:"none",
                  borderBottom:"1px solid rgba(255,255,255,.06)"
                }}
              >
                {m.l}
              </a>

              {m.sub&&m.sub.map((s,j)=>
                <a
                  key={j}
                  href={getSectionHref(s.id,path)}
                  onClick={goTo(s.id)}
                  style={{
                    display:"block",
                    padding:"10px 0 10px 20px",
                    color:"rgba(186,200,218,.72)",
                    fontSize:14,
                    fontFamily:F,
                    textDecoration:"none"
                  }}
                >
                  → {s.l}
                </a>
              )}
            </div>
          )}

          <a
            href={wm("Hola CONTARAE, me gustaría recibir asesoría.")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={()=>sO(false)}
            style={{
              display:"block",
              marginTop:14,
              padding:"13px 20px",
              borderRadius:11,
              background:"linear-gradient(135deg,#2563EB,#38BDF8)",
              color:"#fff",
              fontSize:15,
              fontWeight:700,
              textDecoration:"none",
              textAlign:"center",
              fontFamily:F,
              boxShadow:"0 10px 24px rgba(37,99,235,.22)"
            }}
          >
            WhatsApp
          </a>
        </div>
      }

      <div style={{
        position:"absolute",
        bottom:0,
        left:0,
        width:"100%",
        height:2,
        background:"linear-gradient(90deg, rgba(56,189,248,0), rgba(37,99,235,.72), rgba(56,189,248,.82), rgba(125,211,252,.72), rgba(56,189,248,0))",
        backgroundSize:"200% 100%",
        animation:"navShine 7s linear infinite",
        boxShadow:"0 0 14px rgba(56,189,248,.30)"
      }}/>
    </nav>
  );
}


function Banner({path}){const[s,sS]=useState(true);if(!s)return null;return(<div style={{position:"fixed",top:94,left:"50%",transform:"translateX(-50%)",width:"min(620px,calc(100% - 44px))",zIndex:190,pointerEvents:"none"}}><div style={{background:"linear-gradient(90deg,#163457,#2563EB)",padding:"6px 12px",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,flexWrap:"wrap",boxShadow:"0 10px 22px rgba(15,23,42,.12)",border:"1px solid rgba(255,255,255,.10)",pointerEvents:"auto"}}><span style={{fontSize:11,color:"#fff",fontFamily:F,lineHeight:1.35,textAlign:"center"}}>🔥 <strong>¿Necesita su certificación de ingresos HOY?</strong></span><a href={getSectionHref("certificacion",path)} style={{fontSize:11,color:"#fff",fontWeight:800,background:"rgba(255,255,255,.16)",padding:"5px 11px",borderRadius:999,textDecoration:"none",fontFamily:F,letterSpacing:".2px"}}>Solicitar</a><button onClick={()=>sS(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.65)",cursor:"pointer",fontSize:13,padding:0,marginLeft:2,fontFamily:F}}>✕</button></div></div>)}

/* HERO WITH ANIMATED BG */

function Hero(){
  return(
    <section
      id="inicio"
      style={{
        minHeight:"100vh",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        textAlign:"center",
        padding:"148px 24px 86px",
        position:"relative",
        overflow:"hidden",
        background:"linear-gradient(135deg,#F4F8FF 0%,#E7F0FF 20%,#EAF7FF 52%,#F8FBFF 100%)",
        backgroundSize:"220% 220%",
        animation:"gradBg 20s ease-in-out infinite"
      }}
    >
      <style>{`
        @keyframes gradBg{
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        @keyframes driftWave{
          0%{transform:translate3d(-18px,-6px,0) scale(1.01)}
          50%{transform:translate3d(56px,18px,0) scale(1.045)}
          100%{transform:translate3d(-18px,-6px,0) scale(1.01)}
        }
        @keyframes driftWaveAlt{
          0%{transform:translate3d(16px,8px,0) scale(1.01)}
          50%{transform:translate3d(-48px,-18px,0) scale(1.04)}
          100%{transform:translate3d(16px,8px,0) scale(1.01)}
        }
        @keyframes floatSoft{
          0%{transform:translateY(0px) scale(1)}
          50%{transform:translateY(-16px) scale(1.04)}
          100%{transform:translateY(0px) scale(1)}
        }
        @keyframes heroReveal{
          0%{opacity:0;transform:translateY(32px)}
          100%{opacity:1;transform:translateY(0)}
        }
        @keyframes glowPulse{
          0%{opacity:.72}
          50%{opacity:1}
          100%{opacity:.72}
        }
      `}</style>

      <div style={{
        position:"absolute",
        inset:0,
        background:"radial-gradient(circle at 14% 18%, rgba(59,130,246,.16) 0%, rgba(59,130,246,0) 24%), radial-gradient(circle at 84% 18%, rgba(14,165,233,.13) 0%, rgba(14,165,233,0) 22%), radial-gradient(circle at 74% 74%, rgba(96,165,250,.10) 0%, rgba(96,165,250,0) 20%)"
      }}/>

      <div style={{
        position:"absolute",
        top:"10%",
        left:"-7%",
        width:360,
        height:360,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(59,130,246,.18) 0%, rgba(59,130,246,0) 70%)",
        filter:"blur(18px)",
        animation:"floatSoft 13s ease-in-out infinite"
      }}/>
      <div style={{
        position:"absolute",
        bottom:"-12%",
        right:"-5%",
        width:400,
        height:400,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(14,165,233,.16) 0%, rgba(14,165,233,0) 72%)",
        filter:"blur(18px)",
        animation:"floatSoft 16s ease-in-out infinite"
      }}/>
      <div style={{
        position:"absolute",
        top:"16%",
        left:"50%",
        transform:"translateX(-50%)",
        width:620,
        height:620,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(96,165,250,.10) 0%, rgba(255,255,255,0) 67%)",
        filter:"blur(26px)",
        animation:"glowPulse 12s ease-in-out infinite"
      }}/>

      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        style={{
          position:"absolute",
          inset:0,
          width:"100%",
          height:"100%",
          opacity:.58,
          animation:"driftWave 15s ease-in-out infinite"
        }}
      >
        <defs>
          <linearGradient id="waveStroke1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(96,165,250,0)" />
            <stop offset="30%" stopColor="rgba(59,130,246,.24)" />
            <stop offset="60%" stopColor="rgba(14,165,233,.18)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
          </linearGradient>
          <linearGradient id="waveStroke2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59,130,246,0)" />
            <stop offset="45%" stopColor="rgba(59,130,246,.18)" />
            <stop offset="75%" stopColor="rgba(125,211,252,.15)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </linearGradient>
        </defs>
        <path d="M-80 240 C 180 150, 360 350, 620 255 S 1120 130, 1680 270" fill="none" stroke="url(#waveStroke1)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M-120 640 C 220 500, 480 760, 820 625 S 1280 520, 1720 690" fill="none" stroke="url(#waveStroke2)" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M1060 160 C 1220 230, 1280 340, 1170 470 C 1070 585, 1090 705, 1330 760" fill="none" stroke="rgba(59,130,246,.08)" strokeWidth="52" strokeLinecap="round"/>
      </svg>

      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        style={{
          position:"absolute",
          inset:0,
          width:"100%",
          height:"100%",
          opacity:.5,
          animation:"driftWaveAlt 17s ease-in-out infinite"
        }}
      >
        <path d="M-120 330 C 140 250, 390 440, 660 360 S 1130 255, 1720 410" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M-100 710 C 180 610, 470 820, 820 710 S 1270 620, 1710 760" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>

      <div style={{
        position:"relative",
        zIndex:1,
        maxWidth:860,
        padding:"0 8px"
      }}>
        <div style={{
          display:"inline-block",
          padding:"8px 20px",
          borderRadius:100,
          background:"rgba(255,255,255,.68)",
          border:"1px solid rgba(37,99,235,.11)",
          boxShadow:"0 10px 24px rgba(37,99,235,.06)",
          fontSize:12,
          fontWeight:700,
          color:"#1D4ED8",
          marginBottom:30,
          letterSpacing:"1.5px",
          fontFamily:F,
          backdropFilter:"blur(8px)",
          animation:"heroReveal 1.15s cubic-bezier(.22,1,.36,1) both"
        }}>
          CONTADORES PÚBLICOS CERTIFICADOS EN COLOMBIA
        </div>

        <h1 style={{
          fontFamily:FH,
          fontSize:"clamp(32px,5.3vw,58px)",
          fontWeight:700,
          lineHeight:1.08,
          color:"#0B1D3A",
          marginBottom:22,
          animation:"heroReveal 1.35s cubic-bezier(.22,1,.36,1) both",
          animationDelay:".22s"
        }}>
          Soluciones contables con visión <span style={{color:"#2563EB"}}>moderna, clara y confiable</span>
        </h1>

        <p style={{
          fontSize:17,
          color:"#475569",
          lineHeight:1.85,
          maxWidth:720,
          margin:"0 auto 38px",
          fontFamily:F,
          animation:"heroReveal 1.45s cubic-bezier(.22,1,.36,1) both",
          animationDelay:".46s"
        }}>
          Servicios contables, tributarios y financieros para personas y empresas en Colombia.
          Procesos bien estructurados, acompañamiento profesional y una experiencia digital más ágil para impulsar su crecimiento.
        </p>

        <div style={{marginBottom:14,animation:"heroReveal 1.55s cubic-bezier(.22,1,.36,1) both",animationDelay:".74s"}}>
          <a
            href="#certificacion"
            style={{
              display:"inline-block",
              padding:"15px 34px",
              borderRadius:15,
              background:"linear-gradient(135deg,#2563EB,#38BDF8)",
              color:"#fff",
              fontSize:15,
              fontWeight:700,
              textDecoration:"none",
              boxShadow:"0 18px 34px rgba(37,99,235,.18)",
              fontFamily:F,
              textAlign:"center",
              lineHeight:1.4,
              border:"1px solid rgba(191,219,254,.28)",
              transition:"transform .28s ease, box-shadow .28s ease, filter .28s ease",
              position:"relative",
              overflow:"hidden"
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.boxShadow="0 20px 36px rgba(37,99,235,.24)";
              e.currentTarget.style.filter="brightness(1.02)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.boxShadow="0 16px 30px rgba(37,99,235,.18)";
              e.currentTarget.style.filter="brightness(1)";
            }}
          >
            Solicite su certificado de ingresos firmado por Contador Público
          </a>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:12,animation:"heroReveal 1.55s cubic-bezier(.22,1,.36,1) both",animationDelay:".98s"}}>
          <a
            href="#planes"
            style={{
              padding:"12px 24px",
              borderRadius:12,
              color:"#1E3A8A",
              fontSize:14,
              fontWeight:700,
              textDecoration:"none",
              border:"1px solid rgba(37,99,235,.12)",
              background:"rgba(255,255,255,.68)",
              fontFamily:F,
              backdropFilter:"blur(8px)",
              boxShadow:"0 10px 20px rgba(37,99,235,.05)",
              transition:"transform .26s ease, box-shadow .26s ease, background .26s ease"
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.boxShadow="0 14px 24px rgba(37,99,235,.10)";
              e.currentTarget.style.background="rgba(255,255,255,.88)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.boxShadow="0 10px 20px rgba(37,99,235,.05)";
              e.currentTarget.style.background="rgba(255,255,255,.68)";
            }}
          >
            Ver Planes de Contabilidad
          </a>

          <a
            href="#tramites"
            style={{
              padding:"12px 24px",
              borderRadius:12,
              color:"#1E3A8A",
              fontSize:14,
              fontWeight:700,
              textDecoration:"none",
              border:"1px solid rgba(37,99,235,.12)",
              background:"rgba(255,255,255,.68)",
              fontFamily:F,
              backdropFilter:"blur(8px)",
              boxShadow:"0 10px 20px rgba(37,99,235,.05)",
              transition:"transform .26s ease, box-shadow .26s ease, background .26s ease"
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.boxShadow="0 14px 24px rgba(37,99,235,.10)";
              e.currentTarget.style.background="rgba(255,255,255,.88)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.boxShadow="0 10px 20px rgba(37,99,235,.05)";
              e.currentTarget.style.background="rgba(255,255,255,.68)";
            }}
          >
            Declaración de Renta
          </a>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",animation:"heroReveal 1.55s cubic-bezier(.22,1,.36,1) both",animationDelay:"1.18s"}}>
          <a
            href="#servicios"
            style={{
              padding:"10px 20px",
              borderRadius:10,
              background:"rgba(37,99,235,.08)",
              color:"#1E3A8A",
              fontSize:14,
              fontWeight:700,
              textDecoration:"none",
              fontFamily:F,
              border:"1px solid rgba(37,99,235,.10)",
              transition:"transform .26s ease, background .26s ease, box-shadow .26s ease"
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.background="rgba(37,99,235,.12)";
              e.currentTarget.style.boxShadow="0 12px 22px rgba(37,99,235,.08)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.background="rgba(37,99,235,.08)";
              e.currentTarget.style.boxShadow="none";
            }}
          >
            Asesoría Tributaria
          </a>

          <a
            href="#tramites"
            style={{
              padding:"10px 20px",
              borderRadius:10,
              background:"rgba(37,99,235,.08)",
              color:"#1E3A8A",
              fontSize:14,
              fontWeight:700,
              textDecoration:"none",
              fontFamily:F,
              border:"1px solid rgba(37,99,235,.10)",
              transition:"transform .26s ease, background .26s ease, box-shadow .26s ease"
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.background="rgba(37,99,235,.12)";
              e.currentTarget.style.boxShadow="0 12px 22px rgba(37,99,235,.08)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.background="rgba(37,99,235,.08)";
              e.currentTarget.style.boxShadow="none";
            }}
          >
            Crear mi Empresa
          </a>
        </div>
      </div>
    </section>
  );
}


function WhyUs(){return(<Sec id="whyus" title="¿Por qué elegir a CONTARAE?" sub="NUESTROS DIFERENCIALES" bg={B[6]}><div style={{maxWidth:760,margin:"0 auto 24px",textAlign:"center",fontSize:15,color:"#5A6F8A",lineHeight:1.8,fontFamily:F}}>Diseñamos una experiencia profesional, clara y cercana para que cada trámite, cálculo o servicio tenga una presentación más confiable y fácil de entender.</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>{[
  {i:"⚡",t:"Respuesta inmediata",d:"Atendemos su solicitud en menos de 24 horas hábiles. Su tiempo es valioso y lo respetamos con la agilidad que necesita."},
  {i:"🎓",t:"Contadores Públicos certificados",d:"Profesionales con tarjeta profesional vigente ante la Junta Central de Contadores y experiencia comprobada."},
  {i:"💻",t:"100% en línea",d:"Todos nuestros servicios se gestionan de forma digital, sin desplazamientos. Desde cualquier lugar de Colombia."},
  {i:"💲",t:"Precios transparentes",d:"Conozca el valor exacto antes de contratar. Sin costos ocultos ni sorpresas desde el primer contacto."},
  {i:"🔒",t:"Confidencialidad garantizada",d:"Su información financiera protegida conforme a la Ley 1581 de 2012. Total reserva profesional."},
  {i:"🤝",t:"Acompañamiento permanente",d:"No solo hacemos el trámite: lo asesoramos en cada paso. Somos su aliado contable de largo plazo."}
].map((w,i)=><Cd key={i}><div style={{fontSize:28,marginBottom:8}}>{w.i}</div><h3 style={{fontSize:16,fontWeight:700,color:"#0B1D3A",marginBottom:6,fontFamily:F}}>{w.t}</h3><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.75,fontFamily:F}}>{w.d}</p></Cd>)}</div></Sec>)}

function SvcS(){const svcs=[
  {i:"📊",t:"Contabilidad Integral",d:"Ciclo contable completo para microempresas, emprendedores y pymes: registro de operaciones, conciliaciones bancarias, estados financieros y aplicación de NIIF.",w:"Hola CONTARAE, estoy interesado en el servicio de Contabilidad Integral."},
  {i:"📋",t:"Asesoría Tributaria",d:"Acompañamiento en obligaciones ante la DIAN: declaración de renta, IVA, retención en la fuente, ICA, información exógena y planeación tributaria.",w:"Hola CONTARAE, necesito asesoría tributaria."},
  {i:"💰",t:"Gestión Financiera",d:"Presupuestos, flujo de caja, indicadores financieros (KPIs), análisis de costos y reportes gerenciales personalizados.",w:"Hola CONTARAE, me interesa el servicio de Gestión Financiera."},
  {i:"👥",t:"Nómina y Seguridad Social",d:"Liquidación de salarios, prestaciones sociales, aportes a seguridad social, planilla PILA, contratos laborales y formulario 220.",w:"Hola CONTARAE, necesito información sobre Nómina y Seguridad Social."},
  {i:"📄",t:"Certificaciones Contables",d:"Certificados de ingresos, patrimonio y más, firmados por Contador Público. Conforme a Ley 43 de 1990. Entrega digital inmediata en PDF.",w:"Hola CONTARAE, necesito una certificación contable."},
  {i:"🔧",t:"Otros Servicios Contables",d:"Auditoría interna, informes financieros especiales, asesoría ante la DIAN, liquidación de empresas, constitución de consorcios y orientación societaria.",w:"Hola CONTARAE, necesito información sobre un servicio contable específico."}
];return(<Sec id="servicios" title="Soluciones profesionales para su negocio" sub="NUESTROS SERVICIOS" bg={B[1]}><p style={{textAlign:"center",fontSize:15,color:"#5A6F8A",marginTop:-34,marginBottom:38,maxWidth:680,margin:"-34px auto 38px",fontFamily:F}}>Outsourcing contable para microempresas, emprendedores y pymes en Colombia.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:18}}>{svcs.map((s,i)=><Cd key={i}><div style={{fontSize:28,marginBottom:8}}>{s.i}</div><h3 style={{fontSize:16,fontWeight:700,color:"#0B1D3A",marginBottom:6,fontFamily:F}}>{s.t}</h3><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.75,fontFamily:F}}>{s.d}</p><a href={wm(s.w)} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:10,fontSize:14,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Solicitar asesoría →</a></Cd>)}</div></Sec>)}

function PlnS(){
  const plans=[
    {n:"Emprendedor",p:500000,tg:"Independientes y microempresas",f:["Declaraciones tributarias básicas (IVA, Rete fuente)","Conciliación bancaria mensual","Estados financieros trimestrales","Asesoría tributaria básica permanente","Soporte por WhatsApp"],w:"Hola CONTARAE, estoy interesado en el Plan Emprendedor."},
    {n:"Empresarial",p:1000000,tg:"Pequeñas y medianas empresas",f:["Todo lo del Plan Emprendedor","Registro contable mensual completo","Liquidación de nómina y seguridad social","Estados financieros mensuales","Información exógena DIAN","Indicadores financieros y KPIs","Planeación tributaria estratégica","Soporte prioritario"],pop:true,w:"Hola CONTARAE, me interesa el Plan Empresarial."},
    {n:"Premium",p:2000000,tg:"Empresas en crecimiento",f:["Todo lo del Plan Empresarial","Presupuestos y control de gestión","Dashboard financiero con Power BI","Análisis de costos por centro","Reuniones mensuales con informe gerencial","Asesor financiero dedicado","Soporte 24/7"],w:"Hola CONTARAE, quiero conocer el Plan Premium."}
  ];
  const cardHover=(e,on)=>{
    const el=e.currentTarget;
    el.style.transform=on?"translateY(-8px) scale(1.022)":"translateY(0) scale(1)";
    el.style.boxShadow=on
      ?(el.dataset.pop==="1"?"0 28px 58px rgba(8,23,48,.30), 0 0 0 1px rgba(125,211,252,.22) inset":"0 26px 54px rgba(37,99,235,.15), 0 0 0 1px rgba(96,165,250,.24) inset")
      :(el.dataset.pop==="1"?"0 22px 46px rgba(8,23,48,.20), 0 0 0 1px rgba(125,211,252,.16) inset":"0 18px 42px rgba(15,23,42,.07), 0 0 0 1px rgba(255,255,255,.55) inset");
    const ring=el.querySelector('.plan-glow');
    if(ring) ring.style.opacity=on?"1":".72";
  };
  return(
    <Sec id="planes" title="Contabilidad integral para su empresa" sub="PLANES MENSUALES" bg={B[2]}>
      <p style={{textAlign:"center",fontSize:14,color:"#5A6F8A",marginTop:-34,marginBottom:36,fontFamily:F}}>Precios de referencia según volumen de información.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:18}}>
        {plans.map((p,i)=>(
          <div
            key={i}
            data-pop={p.pop?"1":"0"}
            onMouseEnter={e=>cardHover(e,true)}
            onMouseLeave={e=>cardHover(e,false)}
            style={{
              padding:p.pop? "40px 28px 28px":"28px",
              borderRadius:20,
              position:"relative",
              overflow:"hidden",
              transform:"translateY(0) scale(1)",
              transition:"transform .34s ease, box-shadow .34s ease, border-color .34s ease",
              background:p.pop?"linear-gradient(145deg,#071427 0%, #0E274B 52%, #163B6A 100%)":"linear-gradient(180deg, rgba(255,255,255,.985), rgba(255,255,255,.94))",
              color:p.pop?"#F8FBFF":"#0B1D3A",
              border:p.pop?"1px solid rgba(125,211,252,.18)":"1px solid rgba(37,99,235,.09)",
              boxShadow:p.pop?"0 22px 46px rgba(8,23,48,.20), 0 0 0 1px rgba(125,211,252,.16) inset":"0 18px 42px rgba(15,23,42,.07), 0 0 0 1px rgba(255,255,255,.55) inset",
              backdropFilter:"blur(10px)",
              isolation:"isolate"
            }}
          >
            <div className="plan-glow" style={{position:"absolute",inset:-1,borderRadius:20,background:p.pop?"linear-gradient(120deg, rgba(56,189,248,0) 0%, rgba(96,165,250,.42) 22%, rgba(255,255,255,.82) 34%, rgba(59,130,246,.30) 48%, rgba(37,99,235,0) 64%, rgba(125,211,252,.22) 78%, rgba(37,99,235,0) 100%)":"linear-gradient(120deg, rgba(37,99,235,0) 0%, rgba(56,189,248,.38) 18%, rgba(255,255,255,.9) 32%, rgba(59,130,246,.22) 48%, rgba(37,99,235,0) 62%, rgba(125,211,252,.18) 78%, rgba(37,99,235,0) 100%)",backgroundSize:"220% 220%",animation:"cardGlowFlow 7.2s linear infinite",opacity:.72,filter:"blur(1px)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:p.pop?"linear-gradient(90deg, rgba(125,211,252,0), rgba(125,211,252,.55), rgba(56,189,248,.35), rgba(125,211,252,0))":"linear-gradient(90deg, rgba(37,99,235,0), rgba(96,165,250,.44), rgba(56,189,248,.35), rgba(37,99,235,0))",zIndex:1}}/>
            {p.pop&&<div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",background:"#60A5FA",color:"#fff",fontSize:10,fontWeight:700,padding:"4px 14px",borderRadius:100,fontFamily:F,zIndex:2}}>MÁS POPULAR</div>}
            <div style={{position:"relative",zIndex:2}}>
              <h3 style={{fontSize:20,fontWeight:700,fontFamily:F,marginBottom:4,color:p.pop?"#FFFFFF":"#0B1D3A"}}>{p.n}</h3>
              <div style={{fontSize:13,opacity:p.pop?.86:.62,marginBottom:8,fontFamily:F,color:p.pop?"rgba(255,255,255,.82)":"#5A6F8A"}}>{p.tg}</div>
              <div style={{marginBottom:16}}>
                <span style={{fontSize:14,textDecoration:"line-through",opacity:p.pop?.72:.5,fontFamily:F,color:p.pop?"rgba(255,255,255,.72)":"#64748B"}}>${fm(disc(p.p))}/mes</span>
                <span style={{display:"inline-block",marginLeft:8,fontSize:10,fontWeight:700,color:"#fff",background:"#DC2626",padding:"2px 8px",borderRadius:100,fontFamily:F}}>25% OFF</span>
                <div style={{fontSize:21,fontWeight:700,fontFamily:FH,color:p.pop?"#8DD8FF":"#2563EB",marginTop:4}}>Desde ${fm(p.p)}/mes</div>
              </div>
              {p.f.map((f,j)=><div key={j} style={{fontSize:14,padding:"5px 0",borderBottom:`1px solid ${p.pop?"rgba(255,255,255,.12)":"rgba(37,99,235,.05)"}`,fontFamily:F,opacity:p.pop?.98:.9,color:p.pop?"rgba(255,255,255,.94)":"#1F3147"}}>✓ {f}</div>)}
              <a href={wm(p.w)} target="_blank" rel="noopener noreferrer" style={{display:"block",marginTop:18,padding:"12px 20px",borderRadius:11,background:p.pop?"linear-gradient(135deg,#4FA2FF,#7CCBFF)":"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none",textAlign:"center",fontFamily:F,boxShadow:p.pop?"0 12px 26px rgba(96,165,250,.22)":"0 12px 24px rgba(37,99,235,.16)"}}>Solicitar información</a>
            </div>
          </div>
        ))}
      </div>
    </Sec>
  )
}

function ScnS(){const scn=[{e:"👔",t:"Soy empleado y necesito certificación para arrendar",d:"Le piden certificación de ingresos firmada por contador. La emitimos en horas, 100% en línea.",l:"#certificacion"},{e:"💼",t:"Soy independiente y no sé si debo declarar renta",d:"Sus ingresos pueden obligarlo a declarar. Use nuestra herramienta para verificar al instante.",l:"#tool-renta"},{e:"🏪",t:"Tengo una pyme y necesito organizar mi contabilidad",d:"Su empresa necesita estados financieros confiables y cumplimiento tributario. Nuestros planes lo cubren.",l:"#planes"},{e:"📋",t:"Me pidieron renovar la matrícula mercantil",d:"El plazo vence el 31 de marzo. No renovar genera sanciones. Hacemos el trámite completo.",l:"#tramites"},{e:"🏗️",t:"Quiero crear mi empresa legalmente en Colombia",d:"SAS, LTDA o S.A., Cámara de Comercio, RUT y todos los requisitos para operar formalmente.",l:"#tramites"},{e:"🧮",t:"Quiero saber cuánto me retienen o debo pagar",d:"Use nuestras herramientas: retención en la fuente, planilla independientes, nómina e IVA.",l:"#herramientas"}];
return(<Sec id="escenarios" title="¿Se identifica con alguno de estos casos?" sub="¿EN QUÉ LE PODEMOS AYUDAR?" bg={B[3]}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>{scn.map((s,i)=><a key={i} href={s.l} style={{textDecoration:"none",color:"inherit"}}><Cd s={{cursor:"pointer"}}><div style={{fontSize:28,marginBottom:8}}>{s.e}</div><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:5,fontFamily:F}}>{s.t}</h3><p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.7,fontFamily:F}}>{s.d}</p><span style={{display:"inline-block",marginTop:8,fontSize:13,color:"#2563EB",fontWeight:600,fontFamily:F}}>Ver solución →</span></Cd></a>)}</div></Sec>)}

function TrmS(){const trm=[{i:"📄",t:"Certificación de Ingresos",d:"Documento firmado por Contador Público. Válido ante bancos, inmobiliarias, embajadas. 100% online, entrega inmediata.",l:"cert",w:"Necesito un certificado de ingresos."},{i:"📝",t:"Declaración de Renta",d:"Preparación y presentación ante la DIAN. Plazos 2026: 12 agosto al 26 octubre.",l:"wa",w:"Necesito ayuda con mi declaración de renta."},{i:"🏢",t:"Renovación Matrícula Mercantil",d:"Gestión ante Cámara de Comercio. Plazo: 31 de marzo. Sanciones hasta 17 SMLMV.",l:"wa",w:"Necesito renovar mi matrícula mercantil."},{i:"🧾",t:"Facturación Electrónica",d:"Implementación completa: habilitación DIAN, proveedor tecnológico, capacitación y soporte.",l:"wa",w:"Necesito implementar facturación electrónica."},{i:"📊",t:"Información Exógena",d:"Medios magnéticos ante la DIAN. Sanciones desde $524.000 hasta 5% de sumas no reportadas.",l:"wa",w:"Necesito ayuda con información exógena."},{i:"🏗️",t:"Creación de Empresas",d:"SAS, LTDA, S.A.: estatutos, Cámara de Comercio, RUT, cuenta bancaria e IVA.",l:"wa",w:"Quiero crear mi empresa en Colombia."}];
return(<Sec id="tramites" title="Trámites más solicitados" sub="TRÁMITES CLAVE" bg={B[4]}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>{trm.map((t,i)=><Cd key={i}><div style={{fontSize:26,marginBottom:6}}>{t.i}</div><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:5,fontFamily:F}}>{t.t}</h3><p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.75,fontFamily:F}}>{t.d}</p><a href={t.l==="cert"?"#certificacion":wm("Hola CONTARAE, "+t.w)} target={t.l==="wa"?"_blank":undefined} style={{display:"inline-block",marginTop:8,fontSize:13,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>{t.l==="cert"?"Solicitar al instante →":"Solicitar servicio →"}</a></Cd>)}</div></Sec>)}

function MiniTrustIcon({kind}){
  const common={width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round"};
  if(kind==="bank")return(<svg {...common}><path d="M3 10h18"/><path d="M5 10v7"/><path d="M9.5 10v7"/><path d="M14.5 10v7"/><path d="M19 10v7"/><path d="M2 17h20"/><path d="M12 4l9 4H3l9-4z"/></svg>);
  if(kind==="home")return(<svg {...common}><path d="M4 11.5L12 5l8 6.5"/><path d="M6.5 10.5V19h11v-8.5"/><path d="M10 19v-5h4v5"/></svg>);
  if(kind==="globe")return(<svg {...common}><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.7 2.4 4.2 5.3 4.2 8.5S14.7 18.1 12 20.5C9.3 18.1 7.8 15.2 7.8 12S9.3 5.9 12 3.5z"/></svg>);
  if(kind==="car")return(<svg {...common}><path d="M5.5 15.5h13"/><path d="M7 15.5l1.3-4.1A2 2 0 0 1 10.2 10h3.6a2 2 0 0 1 1.9 1.4L17 15.5"/><circle cx="8" cy="16.5" r="1.5"/><circle cx="16" cy="16.5" r="1.5"/></svg>);
  if(kind==="doc")return(<svg {...common}><path d="M8 3.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 19V5A1.5 1.5 0 0 1 8.5 3.5z"/><path d="M14 3.5V8h4"/><path d="M9.5 12h5"/><path d="M9.5 15.5h5"/></svg>);
  return(<svg {...common}><path d="M12 3.5l6 2.2v5.2c0 4-2.4 7.1-6 9.1-3.6-2-6-5.1-6-9.1V5.7L12 3.5z"/><path d="M9.2 12.1l1.8 1.8 4-4"/></svg>);
}

function CertificationHero(){
  const heroMetrics=[["Tiempo estimado","Menos de 1 día hábil"],["Proceso","100% online"],["Pago","Wompi seguro"]];
  const priceRanges=[["Desde $0 hasta $2.000.000","$80.000"],["Desde $2.000.001 hasta $4.000.000","$100.000"],["Desde $4.000.001 hasta $7.000.000","$120.000"],["Desde $7.000.001 hasta $12.000.000","$150.000"],["Desde $12.000.001 hasta $20.000.000","$180.000"],["Más de $20.000.000","$200.000"]];
  const recipientTags=[{label:"Bancos",kind:"bank"},{label:"Inmobiliarias",kind:"home"},{label:"Embajadas",kind:"globe"},{label:"Concesionarios",kind:"car"},{label:"Licitaciones",kind:"doc"},{label:"Arrendadores",kind:"shield"}];
  const processSteps=["Completa el formulario","Paga seguro con Wompi","Recibe el PDF listo para presentar"];
  const proofPoints=["Soportes verificables","Firma profesional","Seguimiento de referencia","Atención humana"];
  return(
    <section style={{padding:"164px 24px 48px",position:"relative",overflow:"hidden",background:"linear-gradient(135deg,#F4F8FF 0%,#E7F0FF 20%,#EAF7FF 52%,#F8FBFF 100%)",backgroundSize:"220% 220%",animation:"gradBg 20s ease-in-out infinite"}}>
      <style>{`
        @keyframes gradBg{
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        @keyframes driftWave{
          0%{transform:translate3d(-18px,-6px,0) scale(1.01)}
          50%{transform:translate3d(56px,18px,0) scale(1.045)}
          100%{transform:translate3d(-18px,-6px,0) scale(1.01)}
        }
        @keyframes driftWaveAlt{
          0%{transform:translate3d(16px,8px,0) scale(1.01)}
          50%{transform:translate3d(-48px,-18px,0) scale(1.04)}
          100%{transform:translate3d(16px,8px,0) scale(1.01)}
        }
        @keyframes floatSoft{
          0%{transform:translateY(0px) scale(1)}
          50%{transform:translateY(-16px) scale(1.04)}
          100%{transform:translateY(0px) scale(1)}
        }
        @keyframes glowPulse{
          0%{opacity:.72}
          50%{opacity:1}
          100%{opacity:.72}
        }
      `}</style>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 14% 18%, rgba(59,130,246,.16) 0%, rgba(59,130,246,0) 24%), radial-gradient(circle at 84% 18%, rgba(14,165,233,.13) 0%, rgba(14,165,233,0) 22%), radial-gradient(circle at 74% 74%, rgba(96,165,250,.10) 0%, rgba(96,165,250,0) 20%)"}}/>
      <div style={{position:"absolute",top:"10%",left:"-7%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle, rgba(59,130,246,.18) 0%, rgba(59,130,246,0) 70%)",filter:"blur(18px)",animation:"floatSoft 13s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:"-12%",right:"-5%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle, rgba(14,165,233,.16) 0%, rgba(14,165,233,0) 72%)",filter:"blur(18px)",animation:"floatSoft 16s ease-in-out infinite"}}/>
      <div style={{position:"absolute",top:"16%",left:"50%",transform:"translateX(-50%)",width:620,height:620,borderRadius:"50%",background:"radial-gradient(circle, rgba(96,165,250,.10) 0%, rgba(255,255,255,0) 67%)",filter:"blur(26px)",animation:"glowPulse 12s ease-in-out infinite"}}/>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.58,animation:"driftWave 15s ease-in-out infinite"}}>
        <defs>
          <linearGradient id="certWaveStroke1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(96,165,250,0)" />
            <stop offset="30%" stopColor="rgba(59,130,246,.24)" />
            <stop offset="60%" stopColor="rgba(14,165,233,.18)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
          </linearGradient>
          <linearGradient id="certWaveStroke2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59,130,246,0)" />
            <stop offset="45%" stopColor="rgba(59,130,246,.18)" />
            <stop offset="75%" stopColor="rgba(125,211,252,.15)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </linearGradient>
        </defs>
        <path d="M-80 240 C 180 150, 360 350, 620 255 S 1120 130, 1680 270" fill="none" stroke="url(#certWaveStroke1)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M-120 640 C 220 500, 480 760, 820 625 S 1280 520, 1720 690" fill="none" stroke="url(#certWaveStroke2)" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M1060 160 C 1220 230, 1280 340, 1170 470 C 1070 585, 1090 705, 1330 760" fill="none" stroke="rgba(59,130,246,.08)" strokeWidth="52" strokeLinecap="round"/>
      </svg>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.5,animation:"driftWaveAlt 17s ease-in-out infinite"}}>
        <path d="M-120 330 C 140 250, 390 440, 660 360 S 1130 255, 1720 410" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M-100 710 C 180 610, 470 820, 820 710 S 1270 620, 1710 760" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      <div style={{maxWidth:1080,margin:"0 auto",position:"relative",zIndex:1}}>
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.02fr) minmax(320px,.88fr)",gap:20,alignItems:"start"}}>
          <div style={{padding:"30px 30px 26px",borderRadius:28,background:"linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.90))",border:"1px solid rgba(37,99,235,.10)",boxShadow:"0 22px 50px rgba(15,23,42,.08)"}}>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:12}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 16px",borderRadius:999,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.10)",fontSize:11,fontWeight:700,color:"#2563EB",letterSpacing:"1.6px",fontFamily:F}}>EMISIÓN ÁGIL Y 100% ONLINE</div>
            </div>
            <div style={{fontSize:11,letterSpacing:"1.8px",fontWeight:800,color:"#64748B",fontFamily:F,marginBottom:10}}>CERTIFICACIÓN DE INGRESOS CON RESPALDO CONTABLE</div>
            <h1 style={{fontFamily:FH,fontSize:"clamp(28px,4.2vw,44px)",fontWeight:700,lineHeight:1.04,color:"#0B1D3A",marginBottom:12,maxWidth:640}}>Recibe tu certificación de ingresos lista para presentar y con respaldo profesional</h1>
            <p style={{fontSize:16,color:"#3F5A7A",lineHeight:1.78,fontFamily:F,maxWidth:620,marginBottom:18}}>Documento firmado por Contador Público, ideal para bancos, arriendos, embajadas y otros trámites que requieren una certificación seria, clara y bien presentada.</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:12}}>
              <a href="#certificacion-info" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 24px",borderRadius:14,background:"#fff",color:"#1D4ED8",fontSize:15,fontWeight:700,textDecoration:"none",fontFamily:F,border:"1px solid rgba(37,99,235,.14)"}}>Conoce más sobre la certificación</a>
              <button type="button" onClick={openCertificationForm} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 28px",borderRadius:14,background:"linear-gradient(135deg,#2563EB,#38BDF8)",color:"#fff",fontSize:15,fontWeight:700,textDecoration:"none",fontFamily:F,boxShadow:"0 16px 30px rgba(37,99,235,.18)",border:"none",cursor:"pointer"}}>Iniciar solicitud</button>
            </div>
            <div style={{fontSize:14,color:"#52647F",fontFamily:F,marginBottom:16,lineHeight:1.7}}>Si los soportes están claros, en muchos casos puede quedar lista <strong style={{color:"#0B1D3A"}}>el mismo día o en menos de 1 día hábil</strong>.</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
              {proofPoints.map((item,i)=><div key={i} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:999,background:"rgba(11,29,58,.04)",border:"1px solid rgba(37,99,235,.08)",fontSize:12,fontWeight:700,color:"#37506F",fontFamily:F}}><span style={{width:20,height:20,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",background:"rgba(37,99,235,.10)",color:"#2563EB",fontSize:12}}>✓</span>{item}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12}}>
              {heroMetrics.map(([label,value],i)=><div key={i} style={{padding:"16px 16px",borderRadius:18,background:"#F8FBFF",border:"1px solid rgba(37,99,235,.10)"}}><div style={{fontSize:11,letterSpacing:"1.3px",fontWeight:800,color:"#64748B",fontFamily:F,marginBottom:6}}>{label}</div><div style={{fontSize:22,fontWeight:800,color:"#0B1D3A",lineHeight:1.1,fontFamily:F}}>{value}</div></div>)}
            </div>
          </div>
          <div style={{padding:"24px 22px",borderRadius:28,background:"linear-gradient(160deg,#0B1D3A,#14345B)",color:"#fff",border:"1px solid rgba(125,211,252,.14)",boxShadow:"0 22px 50px rgba(15,23,42,.12)",display:"grid",gap:14,alignContent:"start"}}>
            <div style={{padding:"18px 18px",borderRadius:20,background:"rgba(255,255,255,.06)",border:"1px solid rgba(125,211,252,.12)"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-end",marginBottom:10,flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:11,letterSpacing:"1.6px",fontWeight:800,color:"#93C5FD",fontFamily:F,marginBottom:6}}>TARIFAS CON DESCUENTO</div>
                  <div style={{fontSize:30,fontWeight:800,lineHeight:1,color:"#fff",fontFamily:F}}>Desde $80.000</div>
                </div>
                <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:999,background:"rgba(249,115,22,.16)",border:"1px solid rgba(249,115,22,.24)",fontSize:11,fontWeight:800,color:"#FDBA74",fontFamily:F}}>25% OFF vigente</div>
              </div>
              <div style={{fontSize:12,color:"rgba(226,232,240,.78)",fontFamily:F,lineHeight:1.65,marginBottom:10}}>
                Los siguientes valores aplican según el rango de ingresos mensuales reportados, desde y hasta cada tramo.
              </div>
              <div style={{display:"grid",gap:8}}>
                {priceRanges.map(([range,price],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"8px 0",borderBottom:i===priceRanges.length-1?"none":"1px solid rgba(125,211,252,.10)"}}><div style={{fontSize:12,color:"rgba(226,232,240,.76)",fontFamily:F,lineHeight:1.6}}>{range}</div><div style={{fontSize:13,fontWeight:800,color:"#fff",fontFamily:F,whiteSpace:"nowrap"}}>{price}</div></div>)}
              </div>
            </div>
            <div style={{padding:"16px 16px 14px",borderRadius:20,background:"rgba(255,255,255,.06)",border:"1px solid rgba(125,211,252,.12)"}}>
              <div style={{fontSize:11,letterSpacing:"1.7px",fontWeight:800,color:"#93C5FD",fontFamily:F,marginBottom:12}}>VÁLIDA PARA PRESENTAR ANTE</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
                {recipientTags.map((item,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:16,background:"rgba(255,255,255,.05)",border:"1px solid rgba(125,211,252,.08)"}}><div style={{width:32,height:32,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(147,197,253,.12)",color:"#BBDDFF"}}><MiniTrustIcon kind={item.kind}/></div><div style={{fontSize:13,fontWeight:700,color:"#E8F2FF",fontFamily:F,lineHeight:1.35}}>{item.label}</div></div>)}
              </div>
            </div>
            <div style={{padding:"16px 16px",borderRadius:20,background:"rgba(255,255,255,.06)",border:"1px solid rgba(125,211,252,.12)"}}>
              <div style={{fontSize:11,letterSpacing:"1.5px",fontWeight:800,color:"#93C5FD",fontFamily:F,marginBottom:10}}>PROCESO CLARO</div>
              <div style={{display:"grid",gap:10}}>
                {processSteps.map((item,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"28px minmax(0,1fr)",gap:10,alignItems:"start"}}><div style={{width:28,height:28,borderRadius:"50%",background:"rgba(96,165,250,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",fontFamily:F}}>{i+1}</div><div style={{fontSize:14,color:"rgba(226,232,240,.86)",lineHeight:1.65,fontFamily:F,fontWeight:600}}>{item}</div></div>)}
              </div>
            </div>
            <div style={{padding:"16px 18px",borderRadius:18,background:"rgba(255,255,255,.08)",border:"1px solid rgba(125,211,252,.12)",fontSize:13,color:"rgba(226,232,240,.84)",lineHeight:1.75,fontFamily:F}}>Atención humana por WhatsApp y correo, revisión profesional antes de emitir y seguimiento por referencia durante todo el proceso.</div>
          </div>
        </div>
      </div>
    </section>
  )
}
/* ══════ CERTIFICATION ══════ */
function CrtS(){
  const CT=[{r:"Ingresos desde $0 hasta $2.000.000",v:80000},{r:"Ingresos desde $2.000.001 hasta $4.000.000",v:100000},{r:"Ingresos desde $4.000.001 hasta $7.000.000",v:120000},{r:"Ingresos desde $7.000.001 hasta $12.000.000",v:150000},{r:"Ingresos desde $12.000.001 hasta $20.000.000",v:180000},{r:"Ingresos desde $20.000.001 en adelante",v:200000}];
  const INITIAL_FORM={n:"",td:"CC",cc:"",le:"",tel:"",em:"",dir:"",ent:"",per:"",iL:"",iP:"",iD:"",iI:"",iA:"",iR:"",iO:"",oD:"",cm:""};
  const PAYMENT_STORAGE_KEY="contarae-certification-reference";
  const PAYMENT_QUERY_PARAM="cert_ref";
  const FINAL_FAILED_STATUSES=new Set(["DECLINED","ERROR","VOIDED","FAILED","REJECTED","CANCELED","CANCELLED"]);
  const PAYMENT_PHASES={idle:"idle",preparing:"preparing",opening:"opening",awaiting:"awaiting",approved:"approved",failed:"failed"};
  const[step,sStep]=useState(0);
  const[f,sF]=useState(INITIAL_FORM);
  const[acc,sAcc]=useState(false);
  const[citySug,sCitySug]=useState([]);
  const[openForm,sOpenForm]=useState(false);
  const[supportFiles,sSupportFiles]=useState([]);
  const[lastRef,sLastRef]=useState("");
  const[paymentFlow,sPaymentFlow]=useState({phase:PAYMENT_PHASES.idle,reference:"",status:"",message:"",consecutive:""});
  const pollTimeoutRef=useRef(null);
  const pollStartedAtRef=useRef(0);
  const u=(k,v)=>sF(p=>({...p,[k]:v}));
  const uF=(k,v)=>sF(p=>({...p,[k]:fmtI(v)}));
  const handleCity=v=>{u("le",v);sCitySug(v.length>=2?CITIES.filter(c=>c.toLowerCase().includes(v.toLowerCase())).slice(0,8):[]);};
  const ings=[["Ingresos laborales","iL","Salario y prestaciones de relación laboral."],["Pensiones","iP","Mesada pensional por vejez, invalidez o sobrevivencia."],["Dividendos","iD","Utilidades como socio o accionista."],["Inversiones","iI","Rendimientos de CDTs, fondos, acciones."],["Arriendos","iA","Cánones de arrendamiento de inmuebles propios."],["Remesas","iR","Dinero recibido del exterior."]];
  const totalIng=ings.reduce((s,[,k])=>s+pN(f[k]),0)+pN(f.iO);
  const tarifa=gT(totalIng);
  const createPaymentReference=()=>`CONTARAE-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  const buildPendingPayload=(paymentReference,uploadedSupportFiles=[])=>({
    nombre:f.n,
    tipo_documento:f.td,
    numero_documento:f.cc,
    lugar_expedicion:f.le,
    telefono:f.tel,
    correo:f.em,
    email:f.em,
    destino:f.dir,
    entidad:f.ent,
    periodo:f.per,
    ingresos_laborales:f.iL,
    pensiones:f.iP,
    dividendos:f.iD,
    inversiones:f.iI,
    arriendos:f.iA,
    remesas:f.iR,
    otros_ingresos:f.iO,
    otros_descripcion:f.oD,
    total_ingresos:"$"+fm(totalIng),
    tarifa_pagada:"$"+fm(tarifa),
    soportes_adjuntos:uploadedSupportFiles.map(file=>file.originalName).join(", "),
    referencia_wompi:paymentReference,
    estado_pago:"PENDIENTE",
    comentarios:f.cm,
    declaracion_juramentada:"ACEPTADA",
    consecutivo:""
  });
  const addSupportFiles=fileList=>{
    const incoming=Array.from(fileList||[]);
    if(!incoming.length)return;
    const next=[...supportFiles];
    const errors=[];
    incoming.forEach(file=>{
      const duplicate=next.some(item=>item.name===file.name&&item.size===file.size&&item.lastModified===file.lastModified);
      const contentType=String(file.type||"").toLowerCase();
      if(duplicate)return;
      if(next.length>=SUPPORT_MAX_FILES){errors.push(`Solo puedes adjuntar hasta ${SUPPORT_MAX_FILES} soportes por solicitud.`);return;}
      if(file.size>SUPPORT_MAX_BYTES){errors.push(`"${file.name}" supera el límite de ${fmtB(SUPPORT_MAX_BYTES)}.`);return;}
      if(contentType&&!SUPPORT_ALLOWED_TYPES.has(contentType)){errors.push(`"${file.name}" no tiene un formato permitido.`);return;}
      next.push(file);
    });
    sSupportFiles(next);
    if(errors.length)alert(errors.join("\n"));
  };
  const removeSupportFile=index=>sSupportFiles(current=>current.filter((_,fileIndex)=>fileIndex!==index));
  const uploadSupportFiles=async reference=>{
    if(!supportFiles.length)return[];
    const body=new FormData();
    body.append("reference",reference);
    supportFiles.forEach(file=>body.append("files",file));
    const response=await fetch("/api/upload-certification-supports",{method:"POST",body});
    const data=await response.json();
    if(!response.ok||!data.ok)throw new Error(data.error||"No fue posible cargar los soportes adjuntos.");
    return Array.isArray(data.supportFiles)?data.supportFiles:[];
  };
  const clearPollTimeout=()=>{if(pollTimeoutRef.current){window.clearTimeout(pollTimeoutRef.current);pollTimeoutRef.current=null;}};
  const clearTrackedReference=()=>{try{window.sessionStorage.removeItem(PAYMENT_STORAGE_KEY);}catch(e){} if(typeof window!=="undefined"){const url=new URL(window.location.href);url.searchParams.delete(PAYMENT_QUERY_PARAM);if(window.history?.replaceState)window.history.replaceState(null,"",`${url.pathname}${url.search}${url.hash}`);}};
  const persistTrackedReference=reference=>{try{window.sessionStorage.setItem(PAYMENT_STORAGE_KEY,reference);}catch(e){} if(typeof window!=="undefined"){const url=new URL(window.location.href);url.searchParams.set(PAYMENT_QUERY_PARAM,reference);if(window.history?.replaceState)window.history.replaceState(null,"",`${url.pathname}${url.search}${url.hash||"#certificacion"}`);}};
  const buildRedirectUrl=reference=>{const url=new URL(window.location.href);url.searchParams.set(PAYMENT_QUERY_PARAM,reference);url.hash="certificacion";return url.toString();};
  const resetForm=()=>{sStep(0);sAcc(false);sCitySug([]);sOpenForm(false);sF(INITIAL_FORM);sSupportFiles([]);};
  const closePaymentFeedback=()=>{clearPollTimeout();sPaymentFlow({phase:PAYMENT_PHASES.idle,reference:"",status:"",message:"",consecutive:""});};
  const releaseCheckoutOverlay=reference=>{sPaymentFlow({phase:PAYMENT_PHASES.idle,reference:reference||"",status:"",message:"",consecutive:""});};
  const getPaymentFailureMessage=status=>{if(status==="DECLINED")return"El pago fue rechazado o declinado por la entidad financiera. Puede intentarlo con otro medio de pago o escribirnos para revisarlo.";if(status==="ERROR")return"No se confirmó el pago por un error en la transacción. Si ve un cobro reflejado, contáctenos y validamos el caso.";if(status==="VOIDED")return"La transacción fue anulada antes de completarse. Puede volver al formulario para intentarlo de nuevo.";return"No se confirmó el pago. Si necesita ayuda, nuestro equipo puede acompañarle por WhatsApp o correo electrónico.";};
  const getPaymentSupportLink=reference=>wm(`Hola CONTARAE, necesito ayuda con mi pago de certificación de ingresos. Referencia: ${reference||lastRef||"SIN_REFERENCIA"}.`);
  const markPaymentApproved=(reference,record={})=>{clearPollTimeout();clearTrackedReference();sPaymentFlow({phase:PAYMENT_PHASES.approved,reference,status:"APPROVED",message:"Pago confirmado y solicitud enviada correctamente para revisión profesional.",consecutive:String(record.consecutive||"")});};
  const markPaymentFailed=(reference,status,message)=>{clearPollTimeout();sPaymentFlow({phase:PAYMENT_PHASES.failed,reference,status:status||"UNCONFIRMED",message:message||getPaymentFailureMessage(status)});};
  const pollPaymentStatus=reference=>{
    if(!reference)return;
    clearPollTimeout();
    pollStartedAtRef.current=Date.now();
    sPaymentFlow({phase:PAYMENT_PHASES.awaiting,reference,status:"PENDING",message:"Estamos confirmando el pago con Wompi y finalizando el envío de su solicitud. Esto puede tardar unos segundos.",consecutive:""});
    const checkStatus=async()=>{
      try{
        const paidResponse=await fetch(`/api/get-paid-form?reference=${encodeURIComponent(reference)}`);
        if(paidResponse.ok){
          const paidData=await paidResponse.json();
          const paidRecord=paidData.record||{};
          if(paidRecord.netlifySubmittedAt){markPaymentApproved(reference,paidRecord);return;}
          sPaymentFlow(prev=>({...prev,phase:PAYMENT_PHASES.awaiting,reference,status:"APPROVED",message:"Pago confirmado en Wompi. Estamos terminando el registro y el envío de la solicitud.",consecutive:String(paidRecord.consecutive||prev.consecutive||"")}));
        }else{
          const pendingResponse=await fetch(`/api/get-pending-form?reference=${encodeURIComponent(reference)}`);
          if(pendingResponse.ok){
            const pendingData=await pendingResponse.json();
            const pendingRecord=pendingData.record||{};
            const backendStatus=String(pendingRecord.status||pendingRecord.lastEventStatus||"").toUpperCase();
            if(FINAL_FAILED_STATUSES.has(backendStatus)){markPaymentFailed(reference,backendStatus,getPaymentFailureMessage(backendStatus));return;}
          }
        }
      }catch(error){}
      if(Date.now()-pollStartedAtRef.current>120000){markPaymentFailed(reference,"UNCONFIRMED","Aún no logramos confirmar el pago automáticamente. Si ya realizó el pago o necesita ayuda, escríbanos y validamos el caso de inmediato.");return;}
      pollTimeoutRef.current=window.setTimeout(checkStatus,2500);
    };
    checkStatus();
  };
  const handleWidgetResult=(reference,result)=>{
    const tx=result&&result.transaction?result.transaction:null;
    const status=String(tx?.status||"").toUpperCase();
    if(status==="APPROVED"){pollPaymentStatus(reference);return;}
    if(FINAL_FAILED_STATUSES.has(status)){markPaymentFailed(reference,status,getPaymentFailureMessage(status));return;}
    if(tx){markPaymentFailed(reference,status,"La transacción no quedó confirmada. Puede intentarlo de nuevo o escribirnos para recibir soporte.");return;}
    markPaymentFailed(reference,"CLOSED","El proceso de pago se cerró antes de confirmarse. Si necesita ayuda, nuestro equipo puede acompañarle por WhatsApp o correo electrónico.");
  };
  const openWompi=async()=>{let paymentReference="";try{
    if(typeof window==="undefined"||!window.WidgetCheckout){alert("La pasarela de pago aún se está cargando. Intente nuevamente en unos segundos.");return;}
    paymentReference=createPaymentReference();
    const phoneDigits=f.tel.replace(/\D/g,"");
    const legalIdType=f.td==="Pasaporte"?"PP":f.td;
    let uploadedSupportFiles=[];
    sLastRef(paymentReference);
    sPaymentFlow({phase:PAYMENT_PHASES.preparing,reference:paymentReference,status:"PREPARING",message:supportFiles.length?"Estamos cargando sus soportes y guardando la solicitud antes de abrir el pago.":"Estamos guardando su solicitud en estado pendiente antes de abrir el pago.",consecutive:""});
    if(supportFiles.length){uploadedSupportFiles=await uploadSupportFiles(paymentReference);}
    const pendingPayload=buildPendingPayload(paymentReference,uploadedSupportFiles);
    const sp=await fetch("/api/save-pending-form",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference:paymentReference,supportFiles:uploadedSupportFiles,...pendingPayload})});
    const spd=await sp.json();
    if(!sp.ok||!spd.ok){closePaymentFeedback();alert("No fue posible preparar la solicitud. Intente nuevamente.");return;}
    persistTrackedReference(paymentReference);
    const sg=await fetch("/.netlify/functions/wompi-signature",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference:paymentReference,amountInCents:tarifa*100,currency:"COP"})});
    const sd=await sg.json();
    if(!sd.signature){clearTrackedReference();closePaymentFeedback();alert("Error generando la firma de seguridad. Intente nuevamente.");return;}
    sOpenForm(false);
    if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
    sPaymentFlow({phase:PAYMENT_PHASES.opening,reference:paymentReference,status:"OPENING",message:"Estamos abriendo la ventana segura de Wompi. Si está en celular, al volver seguiremos confirmando el pago automáticamente.",consecutive:""});
    await new Promise(resolve=>window.setTimeout(resolve,160));
    const ck=new window.WidgetCheckout({
      currency:"COP",
      amountInCents:tarifa*100,
      reference:paymentReference,
      publicKey:WK,
      signature:{integrity:sd.signature},
      redirectUrl:buildRedirectUrl(paymentReference),
      customerData:{
        email:f.em||undefined,
        fullName:f.n||undefined,
        phoneNumber:phoneDigits?phoneDigits.slice(-10):undefined,
        phoneNumberPrefix:phoneDigits?"+57":undefined,
        legalId:f.cc||undefined,
        legalIdType:legalIdType||undefined
      }
    });
    ck.open(result=>handleWidgetResult(paymentReference,result));
    window.setTimeout(()=>releaseCheckoutOverlay(paymentReference),120);
  }catch(e){clearTrackedReference();markPaymentFailed(paymentReference||lastRef,"CONNECTION_ERROR","Ocurrió un problema al conectar con la pasarela de pago. Intente nuevamente o contáctenos para ayudarle.");}};
  const supportRef=paymentFlow.reference||lastRef||"PENDIENTE";
  const supportCode=paymentFlow.consecutive?`Solicitud N° ${paymentFlow.consecutive}`:supportRef;
  const waMsg=`Hola CONTARAE, confirmo mi solicitud:%0ACódigo: ${supportCode}%0AReferencia: ${supportRef}%0ANombre: ${f.n}%0ADocumento: ${f.td} ${f.cc}%0ATotal ingresos: $${fm(totalIng)}%0AValor pagado: $${fm(tarifa)}%0ADestino: ${f.ent||f.dir}%0AEnviaré los soportes documentales por este medio o por correo electrónico.`;
  const pasos=["Datos personales","Destino","Ingresos y soportes","Confirmación y pago","Entrega en PDF"];
  const moveStep=n=>{sStep(n);};
  useEffect(()=>{
    const prev=document.body.style.overflow;
    const shouldLockBody=openForm||[PAYMENT_PHASES.preparing,PAYMENT_PHASES.awaiting,PAYMENT_PHASES.approved,PAYMENT_PHASES.failed].includes(paymentFlow.phase);
    if(shouldLockBody){document.body.style.overflow="hidden";}
    return()=>{document.body.style.overflow=prev;clearPollTimeout();};
  },[openForm,paymentFlow.phase]);
  useEffect(()=>{
    const url=new URL(window.location.href);
    const referenceFromUrl=url.searchParams.get(PAYMENT_QUERY_PARAM);
    let storedReference=referenceFromUrl||"";
    if(!storedReference){try{storedReference=window.sessionStorage.getItem(PAYMENT_STORAGE_KEY)||"";}catch(e){}}
    if(storedReference){sLastRef(storedReference);pollPaymentStatus(storedReference);}
    return()=>clearPollTimeout();
  },[]);
  useEffect(()=>{
    const handleOpenRequested=()=>{sStep(0);sOpenForm(true);};
    window.addEventListener(OPEN_CERT_FORM_EVENT,handleOpenRequested);
    return()=>window.removeEventListener(OPEN_CERT_FORM_EVENT,handleOpenRequested);
  },[]);

  return(<Sec id="certificacion" title="Certificación de ingresos por Contador Público" sub="CERTIFICADO DE INGRESOS ONLINE COLOMBIA" bg={B[5]} narrow>
    <p style={{textAlign:"center",fontSize:15,color:"#5A6F8A",marginTop:-34,marginBottom:10,fontFamily:F}}>Solicítela 100% online y recíbala firmada por Contador Público con tarjeta profesional vigente.</p>
    <p style={{textAlign:"center",fontSize:14,color:"#5A6F8A",marginBottom:36,fontFamily:F}}>Para arriendo, crédito bancario, visa, licitaciones y más. Si sus soportes están claros, en muchos casos puede quedar lista el mismo día o en menos de 1 día hábil.</p>

    <div id="certificacion-info" style={{display:"grid",gap:14,marginBottom:28,scrollMarginTop:"150px"}}>{[["¿Qué es un certificado de ingresos?","Documento suscrito por Contador Público con tarjeta profesional vigente que certifica sus ingresos con base en soportes verificables como extractos bancarios, contratos, facturas y comprobantes de pago."],["¿Por qué firma de Contador Público?","Según la Ley 43 de 1990 (art. 10), la firma otorga fe pública. El CTCP (Concepto 1106/2019) ratifica que deben soportarse en documentación verificable."],["¿Para qué se necesita?","Créditos bancarios, arrendamientos, compra de vehículo, trámites de visa, licitaciones, libreta militar y trámites académicos."],["¿Cuánto cuesta?","Desde $80.000 COP según el rango de ingresos. Incluye revisión profesional, elaboración y firma. Entrega digital en PDF."]].map(([t,d],i)=><div key={i} style={{padding:22,borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.12)"}}><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:6,fontFamily:F}}>{t}</h3><p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.8,fontFamily:F}}>{d}</p></div>)}</div>

    <div style={{padding:24,borderRadius:14,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",marginBottom:28,color:"#fff"}}><h3 style={{fontSize:17,fontWeight:700,marginBottom:14,textAlign:"center",fontFamily:F}}>Tarifas certificado de ingresos</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8}}>{CT.map((t,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:7,background:"rgba(255,255,255,.07)",fontFamily:F}}><span style={{fontSize:14,opacity:.85}}>{t.r}</span><div style={{textAlign:"right"}}><span style={{fontSize:11,textDecoration:"line-through",opacity:.5}}>${fm(disc(t.v))}</span><span style={{display:"inline-block",marginLeft:6,fontSize:9,fontWeight:700,color:"#fff",background:"#DC2626",padding:"1px 6px",borderRadius:100}}>25% OFF</span><div style={{fontSize:15,fontWeight:700,color:"#60A5FA"}}>${fm(t.v)}</div></div></div>)}</div><div style={{marginTop:14,padding:12,borderRadius:8,background:"rgba(96,165,250,.13)",fontSize:13,fontFamily:F}}>🔒 Pago seguro procesado por <strong>Wompi</strong>. Tarjeta, PSE, Nequi o Daviplata.</div></div>

    <div style={{padding:24,borderRadius:16,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 5px 24px rgba(37,99,235,.05)",marginBottom:10}}><h3 style={{fontSize:18,fontWeight:700,color:"#0B1D3A",marginBottom:14,fontFamily:F,textAlign:"center"}}>Así funciona su solicitud</h3><div style={{display:"grid",gap:10,gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))"}}>{["Completa el formulario en minutos","Relaciona solo los ingresos que aplican","Paga seguro con Wompi","Revisión profesional y validación","En muchos casos, la recibes el mismo día"].map((txt,i)=><div key={i} style={{padding:14,borderRadius:12,background:"rgba(37,99,235,.05)",border:"1px solid rgba(37,99,235,.10)"}}><div style={{width:26,height:26,borderRadius:"50%",background:"#2563EB",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,fontFamily:F,marginBottom:8}}>{i+1}</div><div style={{fontSize:14,fontWeight:600,color:"#0B1D3A",lineHeight:1.55,fontFamily:F}}>{txt}</div></div>)}</div><div style={{textAlign:"center",marginTop:18}}><button type="button" onClick={()=>sOpenForm(true)} style={{padding:"14px 28px",borderRadius:14,background:"linear-gradient(135deg,#0B1D3A,#2563EB)",color:"#fff",fontSize:16,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F,boxShadow:"0 14px 30px rgba(37,99,235,.18)"}}>Iniciar formulario de solicitud</button></div></div>

    {openForm&&createPortal(
      <div style={{position:"fixed",inset:0,background:"rgba(8,15,29,.62)",zIndex:12000,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 18px"}} onClick={()=>sOpenForm(false)}><div style={{background:"#fff",borderRadius:22,width:"min(980px, 100%)",maxHeight:"min(92vh, 920px)",overflowY:"auto",padding:24,position:"relative",boxShadow:"0 30px 80px rgba(15,23,42,.28)",border:"1px solid rgba(37,99,235,.10)"}} onClick={e=>e.stopPropagation()}><button type="button" onClick={()=>sOpenForm(false)} style={{position:"absolute",top:16,right:16,width:38,height:38,borderRadius:"50%",border:"1px solid rgba(37,99,235,.12)",background:"#fff",cursor:"pointer",fontSize:18,color:"#1B3A5C",zIndex:2}}>×</button><div style={{display:"flex",gap:4,marginBottom:22,flexWrap:"wrap",justifyContent:"center",paddingRight:40}}>{pasos.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:28,height:28,borderRadius:"50%",background:i<=step?"#2563EB":"#d0d9e8",color:i<=step?"#fff":"#5A6F8A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,fontFamily:F}}>{i+1}</div><span style={{fontSize:12,color:i<=step?"#0B1D3A":"#7A8FA8",fontWeight:i<=step?600:400,fontFamily:F}}>{p}</span>{i<4&&<span style={{color:"#d0d9e8",fontSize:14}}>→</span>}</div>)}</div>

    <div style={{padding:28,borderRadius:16,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 5px 24px rgba(37,99,235,.05)"}}>

    {step===0&&<div><h4 style={{fontSize:16,fontWeight:700,color:"#1B3A5C",marginBottom:14,fontFamily:F}}>📋 Paso 1: Datos Personales</h4><div style={{display:"grid",gap:14}}>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Nombre completo</label><input style={IS} value={f.n} onChange={e=>u("n",e.target.value)}/></div>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Tipo de documento</label><select style={{...IS,cursor:"pointer"}} value={f.td} onChange={e=>u("td",e.target.value)}><option>CC</option><option>TI</option><option>CE</option><option>Pasaporte</option><option>NIT</option></select></div>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Número de documento</label><input style={IS} value={f.cc} onChange={e=>u("cc",e.target.value)}/></div>
      <div style={{position:"relative"}}><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Lugar de expedición</label><input style={IS} value={f.le} onChange={e=>handleCity(e.target.value)} placeholder="Escriba su ciudad..."/>{citySug.length>0&&<div style={{position:"absolute",top:"100%",left:0,width:"100%",background:"#fff",border:"1px solid #d0d9e8",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.1)",zIndex:10,maxHeight:200,overflowY:"auto"}}>{citySug.map((c,i)=><div key={i} onClick={()=>{u("le",c);sCitySug([]);}} style={{padding:"10px 14px",cursor:"pointer",fontSize:14,fontFamily:F,borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.target.style.background="#f0f4fa"} onMouseLeave={e=>e.target.style.background="#fff"}>{c}</div>)}</div>}</div>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Teléfono / WhatsApp</label><input style={IS} value={f.tel} onChange={e=>u("tel",e.target.value)}/></div>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Correo electrónico</label><input style={IS} value={f.em} onChange={e=>u("em",e.target.value)}/></div>
    </div><div style={{textAlign:"right",marginTop:16}}><button type="button" onClick={()=>f.n&&f.cc&&f.tel&&f.em?moveStep(1):alert("Complete todos los campos")} style={{padding:"12px 30px",borderRadius:11,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F}}>Siguiente →</button></div></div>}

    {step===1&&<div><h4 style={{fontSize:16,fontWeight:700,color:"#1B3A5C",marginBottom:14,fontFamily:F}}>🏢 Paso 2: Destino de la Certificación</h4><div style={{display:"grid",gap:14}}>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>¿A quién va dirigida?</label><select style={{...IS,cursor:"pointer"}} value={f.dir} onChange={e=>u("dir",e.target.value)}><option value="">Seleccione...</option>{["Banco o entidad financiera","Inmobiliaria o arrendador","Embajada o trámite migratorio","Concesionario de vehículos","Entidad pública","Contratación o licitación","Otro destino"].map(o=><option key={o}>{o}</option>)}</select></div>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Nombre de la entidad</label><input style={IS} value={f.ent} onChange={e=>u("ent",e.target.value)} placeholder="Ej: Bancolombia, Century 21..."/></div>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Período a certificar</label><select style={{...IS,cursor:"pointer"}} value={f.per} onChange={e=>u("per",e.target.value)}><option value="">Seleccione...</option>{["Último mes","Últimos 3 meses","Últimos 6 meses","Último año","Otro período"].map(o=><option key={o}>{o}</option>)}</select></div>
    </div><div style={{display:"flex",justifyContent:"space-between",marginTop:16}}><button type="button" onClick={()=>moveStep(0)} style={{padding:"12px 22px",borderRadius:11,background:"transparent",color:"#2563EB",fontSize:15,fontWeight:600,border:"2px solid rgba(37,99,235,.2)",cursor:"pointer",fontFamily:F}}>← Atrás</button><button type="button" onClick={()=>f.dir?moveStep(2):alert("Seleccione destino")} style={{padding:"12px 30px",borderRadius:11,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F}}>Siguiente →</button></div></div>}

    {step===2&&<div><h4 style={{fontSize:16,fontWeight:700,color:"#1B3A5C",marginBottom:4,fontFamily:F}}>💰 Paso 3: Ingresos Mensuales y Soportes</h4><p style={{fontSize:13,color:"#7A8FA8",marginBottom:14,fontFamily:F}}>Diligencie solo los que apliquen. El valor se formatea automáticamente.</p>
      <div style={{display:"grid",gap:14}}>{ings.map(([l,k,tip])=><div key={k}><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>{l}</label><span style={{fontSize:13,color:"#7A8FA8",fontFamily:F,display:"block",marginBottom:3}}>{tip}</span><input style={IS} value={f[k]} onChange={e=>uF(k,e.target.value)} placeholder="$ 0"/></div>)}
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Otros ingresos</label><span style={{fontSize:13,color:"#7A8FA8",fontFamily:F,display:"block",marginBottom:3}}>Honorarios, comisiones, actividades independientes.</span><input style={IS} value={f.iO} onChange={e=>uF("iO",e.target.value)} placeholder="$ 0"/><input style={{...IS,marginTop:6}} value={f.oD} onChange={e=>u("oD",e.target.value)} placeholder="Concepto de estos ingresos"/></div></div>

      <div style={{marginTop:18,padding:18,borderRadius:11,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:13,opacity:.55,fontFamily:F}}>TOTAL INGRESOS MENSUALES</div><div style={{fontSize:11,opacity:.4,fontFamily:F}}>Calculado automáticamente — no modificable</div></div><div style={{fontSize:24,fontWeight:700,fontFamily:F,color:"#60A5FA"}}>$ {fm(totalIng)}</div></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,.1)"}}><div><div style={{fontSize:13,opacity:.55,fontFamily:F}}>VALOR A PAGAR</div><div style={{fontSize:11,opacity:.4,fontFamily:F}}>Según tabla de tarifas — no modificable</div></div><div style={{fontSize:22,fontWeight:700,fontFamily:F}}>$ {fm(tarifa)}</div></div></div>

      <div style={{marginTop:16,padding:18,borderRadius:12,background:"rgba(37,99,235,.04)",border:"1px dashed rgba(37,99,235,.16)"}}><h4 style={{fontSize:14,fontWeight:700,color:"#1B3A5C",marginBottom:8,fontFamily:F}}>📎 Soportes documentales opcionales</h4><p style={{fontSize:14,color:"#1B3A5C",lineHeight:1.8,fontFamily:F,marginBottom:10}}>Si ya cuenta con algunos soportes, puede adjuntarlos ahora mismo para que queden vinculados a la solicitud. Esto agiliza la revisión en el panel interno de CONTARAE.</p><div style={{padding:16,borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.12)",marginBottom:12}}><input type="file" multiple accept={SUPPORT_ACCEPT} onChange={e=>{addSupportFiles(e.target.files);e.target.value="";}} style={{...IS,padding:"10px 12px",cursor:"pointer"}}/><div style={{marginTop:8,fontSize:12,color:"#64748B",lineHeight:1.7,fontFamily:F}}>Formatos permitidos: PDF, JPG, PNG, WEBP, HEIC, DOC y DOCX. Máximo {SUPPORT_MAX_FILES} archivos de hasta {fmtB(SUPPORT_MAX_BYTES)} cada uno.</div></div>{supportFiles.length>0&&<div style={{display:"grid",gap:8,marginBottom:12}}>{supportFiles.map((file,index)=><div key={`${file.name}-${file.lastModified}-${index}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.10)"}}><div><div style={{fontSize:14,fontWeight:700,color:"#0B1D3A",fontFamily:F,lineHeight:1.5}}>{file.name}</div><div style={{fontSize:12,color:"#64748B",fontFamily:F}}>{fmtB(file.size)} · {file.type||"Archivo"}</div></div><button type="button" onClick={()=>removeSupportFile(index)} style={{padding:"9px 12px",borderRadius:10,border:"1px solid rgba(220,38,38,.14)",background:"rgba(220,38,38,.06)",color:"#DC2626",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>Quitar</button></div>)}</div>}<p style={{fontSize:14,color:"#3a5068",lineHeight:1.8,fontFamily:F,marginBottom:10}}>Si aún no tiene todos los soportes, puede completar el pago y enviarlos después por <strong>WhatsApp</strong> o <strong>correo electrónico</strong>. Ejemplos: contratos, extractos bancarios, desprendibles de nómina, facturas, certificaciones, comprobantes de pago y demás documentos que acrediten la información reportada.</p><p style={{fontSize:14,color:"#3a5068",lineHeight:1.8,fontFamily:F,marginBottom:0}}>Después de recibir la solicitud, un profesional de CONTARAE se pondrá en contacto para realizar la revisión completa de la documentación y validar la información antes de emitir la certificación.</p></div>

      <div style={{marginTop:12}}><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Comentarios</label><textarea style={{...IS,minHeight:60,resize:"vertical",marginTop:4}} value={f.cm} onChange={e=>u("cm",e.target.value)} placeholder="Información adicional..."/></div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}><button type="button" onClick={()=>moveStep(1)} style={{padding:"12px 22px",borderRadius:11,background:"transparent",color:"#2563EB",fontSize:15,fontWeight:600,border:"2px solid rgba(37,99,235,.2)",cursor:"pointer",fontFamily:F}}>← Atrás</button><button type="button" onClick={()=>totalIng>0?moveStep(3):alert("Ingrese al menos un valor")} style={{padding:"12px 30px",borderRadius:11,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F}}>Siguiente →</button></div>
    </div>}

    {step===3&&<div><h4 style={{fontSize:16,fontWeight:700,color:"#1B3A5C",marginBottom:14,fontFamily:F}}>📋 Paso 4: Confirmación y Pago</h4>
      <div style={{padding:18,borderRadius:11,background:"#f0f4fa",border:"1px solid rgba(37,99,235,.12)",marginBottom:16}}><div style={{display:"grid",gap:6,fontSize:15,fontFamily:F,color:"#3a5068"}}><div><strong>Nombre:</strong> {f.n}</div><div><strong>Documento:</strong> {f.td} {f.cc} — {f.le}</div><div><strong>Teléfono:</strong> {f.tel} | <strong>Correo:</strong> {f.em}</div><div><strong>Destino:</strong> {f.dir} {f.ent&&`— ${f.ent}`} | <strong>Período:</strong> {f.per}</div><div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(37,99,235,.1)"}}><strong>Total ingresos:</strong> <span style={{color:"#2563EB",fontWeight:700,fontSize:17}}>$ {fm(totalIng)}</span> | <strong>Valor a pagar:</strong> <span style={{color:"#0B1D3A",fontWeight:700,fontSize:17}}>$ {fm(tarifa)}</span></div></div></div>

      <div style={{padding:18,borderRadius:11,background:"rgba(220,38,38,.03)",border:"1px solid rgba(220,38,38,.1)",marginBottom:16}}><h4 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:10,fontFamily:F}}>CONDICIONES DEL SERVICIO</h4><div style={{fontSize:14,color:"#3a5068",lineHeight:1.85,fontFamily:F}}>
        <p style={{marginBottom:8}}><strong>1. Veracidad:</strong> Declaro bajo gravedad del juramento (art. 83 Constitución) que la información refleja mi realidad económica. Los soportes son auténticos y no han sido alterados.</p>
        <p style={{marginBottom:8}}><strong>2. Verificación:</strong> CONTARAE verificará la información. No certificará datos no verificables o con inconsistencias.</p>
        <p style={{marginBottom:8}}><strong>3. Política de servicio:</strong> El valor pagado corresponde a revisión, verificación y elaboración. Si no puede emitirse por falta de información atribuible al solicitante, no hay devolución.</p>
        <p><strong>4. Datos personales:</strong> Autorizo el tratamiento conforme a la Ley 1581 de 2012.</p>
      </div><label style={{display:"flex",alignItems:"flex-start",gap:8,marginTop:14,cursor:"pointer"}}><input type="checkbox" checked={acc} onChange={e=>sAcc(e.target.checked)} style={{marginTop:3,accentColor:"#2563EB",width:18,height:18}}/><span style={{fontSize:15,fontWeight:700,color:"#0B1D3A",fontFamily:F}}>He leído, entiendo y acepto las condiciones.</span></label></div>

      <div style={{textAlign:"center"}}><button type="button" onClick={()=>acc?openWompi():alert("Debe aceptar las condiciones")} disabled={!acc} style={{padding:"14px 40px",borderRadius:13,background:acc?"linear-gradient(135deg,#1B3A5C,#2563EB)":"#ccc",color:"#fff",fontSize:16,fontWeight:700,border:"none",cursor:acc?"pointer":"not-allowed",fontFamily:F,boxShadow:acc?"0 4px 20px rgba(37,99,235,.3)":"none"}}>🔒 Pagar $ {fm(tarifa)} con Wompi</button><p style={{fontSize:12,color:"#7A8FA8",marginTop:10,fontFamily:F}}>Guardaremos primero la solicitud en estado pendiente y luego abriremos la pasarela segura de pago.</p></div>
      <div style={{marginTop:14}}><button type="button" onClick={()=>moveStep(2)} style={{padding:"12px 22px",borderRadius:11,background:"transparent",color:"#2563EB",fontSize:15,fontWeight:600,border:"2px solid rgba(37,99,235,.2)",cursor:"pointer",fontFamily:F}}>← Atrás</button></div>
    </div>}
    </div></div></div>, document.body)}

    {[PAYMENT_PHASES.preparing,PAYMENT_PHASES.awaiting,PAYMENT_PHASES.approved,PAYMENT_PHASES.failed].includes(paymentFlow.phase)&&createPortal(<div style={{position:"fixed",inset:0,background:"rgba(8,15,29,.58)",zIndex:12010,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 18px"}} onClick={()=>paymentFlow.phase===PAYMENT_PHASES.awaiting?null:(clearTrackedReference(),closePaymentFeedback())}><div style={{background:"#fff",borderRadius:20,padding:36,maxWidth:560,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.25)",border:"1px solid rgba(37,99,235,.10)"}} onClick={e=>e.stopPropagation()}>
      {paymentFlow.phase===PAYMENT_PHASES.preparing&&<><div style={{display:"inline-block",padding:"6px 18px",borderRadius:100,background:"rgba(37,99,235,.1)",fontSize:15,fontWeight:700,color:"#2563EB",marginBottom:14,fontFamily:F}}>Preparando solicitud</div><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.8,fontFamily:F,marginBottom:0}}>{paymentFlow.message}</p></>}
      {paymentFlow.phase===PAYMENT_PHASES.awaiting&&<><div style={{display:"inline-block",padding:"6px 18px",borderRadius:100,background:"rgba(37,99,235,.1)",fontSize:15,fontWeight:700,color:"#2563EB",marginBottom:14,fontFamily:F}}>Confirmando pago</div><div style={{width:56,height:56,borderRadius:"50%",border:"4px solid rgba(37,99,235,.12)",borderTopColor:"#2563EB",margin:"0 auto 18px",animation:"App-logo-spin 1s linear infinite"}}/><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.8,fontFamily:F,marginBottom:10}}>{paymentFlow.message}</p><p style={{fontSize:13,color:"#7A8FA8",fontFamily:F,marginBottom:0}}>Referencia: <strong>{paymentFlow.reference}</strong></p></>}
      {paymentFlow.phase===PAYMENT_PHASES.approved&&<><div style={{display:"inline-block",padding:"6px 18px",borderRadius:100,background:"rgba(37,99,235,.1)",fontSize:16,fontWeight:700,color:"#2563EB",marginBottom:14,fontFamily:F}}>{paymentFlow.consecutive?`Solicitud N° ${paymentFlow.consecutive}`:"Solicitud registrada"}</div><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.8,fontFamily:F,marginBottom:8}}>Pago confirmado. Su solicitud quedó aprobada en el sistema y uno de nuestros profesionales revisará la documentación que soporte la realidad económica de los ingresos reportados.</p>{supportFiles.length>0&&<p style={{fontSize:14,color:"#1D4ED8",lineHeight:1.8,fontFamily:F,marginBottom:8,fontWeight:700}}>Ya recibimos {supportFiles.length} soporte(s) adjunto(s) en el formulario. Si falta alguno, puede enviarlo después por WhatsApp o correo.</p>}<p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.8,fontFamily:F,marginBottom:8}}>Envíe los soportes por WhatsApp o al correo <strong>{EM}</strong>. Ejemplos: contratos, extractos bancarios, desprendibles de nómina, facturas, certificaciones y demás documentos que acrediten la información suministrada.</p><p style={{fontSize:13,color:"#7A8FA8",fontFamily:F,marginBottom:20}}>Referencia de pago: <strong>{paymentFlow.reference}</strong></p><div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",animation:"heroUp 1.38s ease-out"}}><a href={`${WL}?text=${waMsg}`} target="_blank" rel="noopener noreferrer" style={{padding:"12px 22px",borderRadius:11,background:"#25D366",color:"#fff",fontSize:14,fontWeight:600,textDecoration:"none",fontFamily:F}}>Enviar soportes por WhatsApp</a><a href={`mailto:${EM}?subject=${encodeURIComponent(`Soportes solicitud ${paymentFlow.consecutive||paymentFlow.reference}`)}`} style={{padding:"12px 22px",borderRadius:11,background:"rgba(37,99,235,.08)",color:"#2563EB",fontSize:14,fontWeight:600,textDecoration:"none",fontFamily:F}}>Enviar por correo</a><button type="button" onClick={()=>{closePaymentFeedback();resetForm();clearTrackedReference();}} style={{padding:"12px 22px",borderRadius:11,background:"transparent",color:"#5A6F8A",fontSize:14,fontWeight:600,border:"2px solid rgba(37,99,235,.12)",cursor:"pointer",fontFamily:F}}>Nueva solicitud</button></div></>}
      {paymentFlow.phase===PAYMENT_PHASES.failed&&<><div style={{display:"inline-block",padding:"6px 18px",borderRadius:100,background:"rgba(220,38,38,.10)",fontSize:16,fontWeight:700,color:"#DC2626",marginBottom:14,fontFamily:F}}>Pago no confirmado</div><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.8,fontFamily:F,marginBottom:8}}>{paymentFlow.message}</p><p style={{fontSize:13,color:"#7A8FA8",fontFamily:F,marginBottom:20}}>Referencia: <strong>{paymentFlow.reference||lastRef||"Pendiente"}</strong></p><div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}><a href={getPaymentSupportLink(paymentFlow.reference)} target="_blank" rel="noopener noreferrer" style={{padding:"12px 22px",borderRadius:11,background:"#25D366",color:"#fff",fontSize:14,fontWeight:600,textDecoration:"none",fontFamily:F}}>Solicitar ayuda por WhatsApp</a><a href={`mailto:${EM}?subject=${encodeURIComponent(`Ayuda pago certificación ${paymentFlow.reference||lastRef||""}`)}`} style={{padding:"12px 22px",borderRadius:11,background:"rgba(37,99,235,.08)",color:"#2563EB",fontSize:14,fontWeight:600,textDecoration:"none",fontFamily:F}}>Solicitar ayuda por correo</a><button type="button" onClick={()=>{clearTrackedReference();closePaymentFeedback();sOpenForm(true);sStep(3);}} style={{padding:"12px 22px",borderRadius:11,background:"transparent",color:"#5A6F8A",fontSize:14,fontWeight:600,border:"2px solid rgba(37,99,235,.12)",cursor:"pointer",fontFamily:F}}>Volver al formulario</button></div></>}
    </div></div>, document.body)}</Sec>);
}
/* ══════ TOOLS (ALL VISIBLE) ══════ */
const TOOL_META=[
  {id:"tool-renta",badge:"Verifique",title:"¿Debo declarar renta?",desc:"Revise de forma rápida si podría estar obligado a declarar renta según topes tributarios.",cta:"Ir a la herramienta"},
  {id:"tool-retencion",badge:"Optimice",title:"Retención en la fuente",desc:"Estime la retención mensual con deducciones, rentas exentas y años gravables 2025 y 2026.",cta:"Calcular retención"},
  {id:"tool-planilla",badge:"Simule",title:"Planilla independientes",desc:"Calcule salud, pensión y ARL para contratistas e independientes según su nivel de riesgo.",cta:"Liquidar planilla"},
  {id:"tool-nomina",badge:"Gestione",title:"Liquidador de nómina",desc:"Obtenga devengado, deducciones, prestaciones y costo total del trabajador de forma clara.",cta:"Abrir liquidador"},
  {id:"tool-iva",badge:"Calcule",title:"Liquidador de IVA",desc:"Determine IVA, subtotal y valor total para ventas, cotizaciones y facturación.",cta:"Calcular IVA"},
  {id:"tool-precio",badge:"Convierta",title:"Precio antes de IVA",desc:"Descubra el valor base de un producto o servicio a partir del precio final con IVA incluido.",cta:"Ver herramienta"}
];

const goAnchor=id=>e=>{
  const el=document.getElementById(id);
  if(!el)return;
  e.preventDefault();
  const y=el.getBoundingClientRect().top + window.pageYOffset - 156;
  window.scrollTo({top:y,behavior:"smooth"});
  if(window.history?.replaceState)window.history.replaceState(null,"",`#${id}`);
};

function ToolIntroCard({item}){
  const cardHover=(e,on)=>{
    const el=e.currentTarget;
    el.style.transform=on?"translateY(-8px) scale(1.022)":"translateY(0) scale(1)";
    el.style.boxShadow=on
      ?"0 26px 54px rgba(37,99,235,.15), 0 0 0 1px rgba(96,165,250,.24) inset"
      :"0 18px 42px rgba(15,23,42,.07), 0 0 0 1px rgba(255,255,255,.55) inset";
    const ring=el.querySelector('.toolintro-glow');
    if(ring) ring.style.opacity=on?"1":".72";
  };
  return(
    <div
      onMouseEnter={e=>cardHover(e,true)}
      onMouseLeave={e=>cardHover(e,false)}
      style={{
        padding:24,
        height:"100%",
        display:"flex",
        flexDirection:"column",
        justifyContent:"space-between",
        borderRadius:20,
        background:"#fff",
        border:"1px solid rgba(37,99,235,.12)",
        boxShadow:"0 18px 42px rgba(15,23,42,.07), 0 0 0 1px rgba(255,255,255,.55) inset",
        position:"relative",
        overflow:"hidden",
        transform:"translateY(0) scale(1)",
        transition:"transform .34s ease, box-shadow .34s ease"
      }}
    >
      <div className="toolintro-glow" style={{
        position:"absolute",
        inset:-2,
        borderRadius:22,
        pointerEvents:"none",
        opacity:.72,
        transition:"opacity .34s ease",
        background:"linear-gradient(135deg, rgba(125,211,252,.18), rgba(59,130,246,.10), rgba(125,211,252,.18))",
        maskImage:"linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
        WebkitMaskImage:"linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
        maskComposite:"exclude",
        WebkitMaskComposite:"xor",
        padding:1
      }}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{display:"inline-flex",padding:"6px 12px",borderRadius:999,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.10)",fontSize:11,fontWeight:700,color:"#1D4ED8",letterSpacing:"1.1px",fontFamily:F,marginBottom:14,boxShadow:"0 6px 14px rgba(37,99,235,.05)"}}>{item.badge}</div>
        <h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:10,fontFamily:F,lineHeight:1.25}}>{item.title}</h3>
        <p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.82,fontFamily:F,maxWidth:320}}>{item.desc}</p>
      </div>
      <a
        href={`#${item.id}`}
        onClick={goAnchor(item.id)}
        style={{marginTop:20,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 18px",borderRadius:13,background:"linear-gradient(135deg,#10233F,#2563EB)",color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none",fontFamily:F,boxShadow:"0 12px 24px rgba(37,99,235,.16)",border:"1px solid rgba(191,219,254,.18)",transition:"transform .28s ease, box-shadow .28s ease",position:"relative",zIndex:1}}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 16px 30px rgba(37,99,235,.20)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 12px 24px rgba(37,99,235,.16)";}}
      >
        {item.cta} →
      </a>
    </div>
  )
}

function ToolStage({id,kicker,title,desc,children,tone=0}){const bg=SUB_BG[tone%SUB_BG.length];return(<div id={id} style={{minHeight:"calc(100vh - 108px)",display:"flex",alignItems:"center",padding:"14px 0 10px",scrollMarginTop:"145px"}}><div style={{width:"100%",background:bg,border:"1px solid rgba(37,99,235,.10)",borderRadius:28,padding:"34px 28px 28px",boxShadow:"0 16px 40px rgba(15,23,42,.06)",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg, rgba(37,99,235,0), rgba(37,99,235,.26), rgba(56,189,248,.20), rgba(37,99,235,0))"}}/><div style={{maxWidth:970,margin:"0 auto 14px"}}><div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"6px 14px",borderRadius:999,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.10)",fontSize:11,fontWeight:700,color:"#1D4ED8",letterSpacing:"1.2px",fontFamily:F,marginBottom:12}}><span style={{width:14,height:1.5,background:"rgba(37,99,235,.35)",borderRadius:999}}/>{kicker}</div><h3 style={{fontFamily:FH,fontSize:"clamp(28px,3.9vw,42px)",fontWeight:700,color:"#0B1D3A",lineHeight:1.08,margin:"0 0 10px",maxWidth:720,textWrap:"balance"}}>{title}</h3><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.82,maxWidth:760,fontFamily:F,margin:0}}>{desc}</p></div><div style={{marginTop:12}}>{children}</div></div></div>)}

function Tools(){const uv25=49799,uv26=52374;
return(<Sec id="herramientas" title="Herramientas CONTARAE" sub="HERRAMIENTAS" bg={B[6]}>
  <div style={{maxWidth:860,margin:"0 auto 26px",textAlign:"center"}}>
    <p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.85,fontFamily:F}}>En CONTARAE ponemos a disposición de nuestros usuarios herramientas prácticas elaboradas para facilitar cálculos tributarios, laborales y financieros de uso frecuente. Explore cada herramienta, conozca su utilidad y acceda directamente a la que necesita desde esta sección o desde el menú principal.</p>
  </div>

  <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:22,marginBottom:28}} className="tool-grid">
    {TOOL_META.map(item=><ToolIntroCard key={item.id} item={item}/>) }
  </div>

  <div style={{display:"grid",gap:26}}>
    <ToolStage id="tool-renta" tone={0} kicker="ANÁLISIS TRIBUTARIO" title="¿Debo declarar renta?" desc="Verifique si podría estar obligado a declarar renta a partir de ingresos, patrimonio, compras, consumos y consignaciones. Ideal para campañas informativas, captación de leads y orientación inicial."><ToolRenta uv={uv25}/></ToolStage>
    <ToolStage id="tool-retencion" tone={1} kicker="CÁLCULO MENSUAL" title="Retención en la fuente" desc="Estime la retención aplicable con deducciones y rentas exentas, y compare fácilmente los años 2025 y 2026 para tomar mejores decisiones tributarias."><ToolRet uv25={uv25} uv26={uv26}/></ToolStage>
    <ToolStage id="tool-planilla" tone={2} kicker="SEGURIDAD SOCIAL" title="Planilla independientes" desc="Simule el valor de salud, pensión y ARL para contratistas e independientes con una vista clara del IBC y del total mensual a pagar."><ToolPlan/></ToolStage>
    <ToolStage id="tool-nomina" tone={0} kicker="GESTIÓN LABORAL" title="Liquidador de nómina" desc="Calcule devengado, deducciones, prestaciones, parafiscales y costo total del trabajador en una herramienta diseñada para empleadores y responsables de talento humano."><ToolNom/></ToolStage>
    <ToolStage id="tool-iva" tone={1} kicker="FACTURACIÓN Y VENTAS" title="Liquidador de IVA" desc="Obtenga el IVA correspondiente sobre el valor base y visualice el subtotal y total de la operación para cotizaciones, ventas y procesos comerciales."><ToolIVA/></ToolStage>
    <ToolStage id="tool-precio" tone={2} kicker="CONVERSIÓN DE VALORES" title="Precio antes de IVA" desc="Conozca el valor base de un producto o servicio a partir del precio final con IVA incluido. Útil para análisis de precios, márgenes y estructura comercial."><ToolPrIVA/></ToolStage>
  </div>
</Sec>)}


function ToolCTA({text,msg}){return(
  <div style={{marginTop:18,padding:"18px 18px 16px",borderRadius:16,background:"linear-gradient(135deg, rgba(27,58,92,.08), rgba(37,99,235,.10))",border:"1px solid rgba(37,99,235,.12)"}}>
    <p style={{fontSize:15,lineHeight:1.75,color:"#1B3A5C",fontFamily:F,fontWeight:600,marginBottom:12}}>{text}</p>
    <a href={wm(msg)} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"11px 18px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none",fontFamily:F,boxShadow:"0 10px 22px rgba(37,99,235,.18)"}}>Solicitar asesoría por WhatsApp</a>
  </div>
)}

function ToolRenta({uv}){
  const[rF,sRF]=useState({i:"",p:"",c:"",tc:"",b:"",nit:""});
  const[rR,sRR]=useState(null);
  const t14=1400*uv,t45=4500*uv;
  const getNitDate=(n)=>{const d=(n||"").replace(/\D/g,"").slice(-2);if(d.length!==2)return null;const map=[[[1,2],"12 de agosto"],[[3,4],"13 de agosto"],[[5,6],"14 de agosto"],[[7,8],"18 de agosto"],[[9,10],"19 de agosto"],[[11,12],"20 de agosto"],[[13,14],"21 de agosto"],[[15,16],"24 de agosto"],[[17,18],"25 de agosto"],[[19,20],"26 de agosto"],[[21,22],"27 de agosto"],[[23,24],"28 de agosto"],[[25,26],"31 de agosto"],[[27,28],"1 de septiembre"],[[29,30],"2 de septiembre"],[[31,32],"3 de septiembre"],[[33,34],"4 de septiembre"],[[35,36],"7 de septiembre"],[[37,38],"8 de septiembre"],[[39,40],"9 de septiembre"],[[41,42],"10 de septiembre"],[[43,44],"11 de septiembre"],[[45,46],"14 de septiembre"],[[47,48],"15 de septiembre"],[[49,50],"16 de septiembre"],[[51,52],"17 de septiembre"],[[53,54],"18 de septiembre"],[[55,56],"21 de septiembre"],[[57,58],"22 de septiembre"],[[59,60],"23 de septiembre"],[[61,62],"24 de septiembre"],[[63,64],"25 de septiembre"],[[65,66],"28 de septiembre"],[[67,68],"1 de octubre"],[[69,70],"2 de octubre"],[[71,72],"5 de octubre"],[[73,74],"6 de octubre"],[[75,76],"7 de octubre"],[[77,78],"8 de octubre"],[[79,80],"9 de octubre"],[[81,82],"13 de octubre"],[[83,84],"14 de octubre"],[[85,86],"15 de octubre"],[[87,88],"16 de octubre"],[[89,90],"19 de octubre"],[[91,92],"20 de octubre"],[[93,94],"21 de octubre"],[[95,96],"22 de octubre"],[[97,98],"23 de octubre"],[[99,0],"26 de octubre"]];const num=parseInt(d,10);for(const [[a,b],f] of map){if(num>=a&&num<=b)return f;if(a===99&&d==="00")return f;}return null;};
  const chk=()=>{
    const v=k=>pN(rF[k]);
    const i=v("i"),p=v("p"),c=v("c"),tc=v("tc"),b=v("b");
    const ob=i>=t14||p>=t45||c>=t14||tc>=t14||b>=t14;
    const rz=[];
    if(i>=t14)rz.push(`Ingresos brutos anuales iguales o superiores a ${cop(t14)}.`);
    if(p>=t45)rz.push(`Patrimonio bruto igual o superior a ${cop(t45)}.`);
    if(c>=t14)rz.push(`Compras y consumos iguales o superiores a ${cop(t14)}.`);
    if(tc>=t14)rz.push(`Consumos con tarjeta iguales o superiores a ${cop(t14)}.`);
    if(b>=t14)rz.push(`Consignaciones iguales o superiores a ${cop(t14)}.`);
    sRR({ob,rz,nitDate:ob?getNitDate(rF.nit):null});
  };
  return(
    <div style={PANEL}>
      <h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>¿Debe declarar renta?</h3>
      <div style={{...NOTE_BOX,marginBottom:16}}>Año gravable 2025. UVT usada: {cop(uv)}. Topes de referencia: 1.400 UVT y 4.500 UVT. Referencia: topes vigentes para la declaración 2026 sobre el año gravable 2025.</div>
      <div style={{display:"grid",gap:12}}>
        {[["Ingresos brutos anuales","i",`Tope 1.400 UVT = ${cop(t14)}`],["Patrimonio bruto a 31 de diciembre","p",`Tope 4.500 UVT = ${cop(t45)}`],["Compras y consumos","c",`Tope 1.400 UVT = ${cop(t14)}`],["Consumos con tarjeta de crédito","tc",`Tope 1.400 UVT = ${cop(t14)}`],["Consignaciones y movimientos bancarios","b",`Tope 1.400 UVT = ${cop(t14)}`]].map(([label,key,tip])=><div key={key}><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>{label}</label><div style={{fontSize:12,color:"#64748B",margin:"3px 0 6px",fontFamily:F}}>{tip}</div><input style={IS} value={rF[key]} onChange={e=>sRF(p=>({...p,[key]:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div>)}
        <button type="button" onClick={chk} style={{padding:"12px 20px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Verificar obligación</button>
      </div>
      {rR&&<div style={{marginTop:16,padding:18,borderRadius:14,background:rR.ob?"rgba(220,38,38,.06)":"rgba(22,163,74,.06)",border:`1px solid ${rR.ob?"rgba(220,38,38,.14)":"rgba(22,163,74,.16)"}`}}><div style={{fontSize:17,fontWeight:700,color:rR.ob?"#DC2626":"#15803D",marginBottom:8,fontFamily:F}}>{rR.ob?"Probablemente sí debe declarar renta":"Posiblemente no debe declarar renta"}</div>{rR.rz.length?rR.rz.map((x,i)=><div key={i} style={{fontSize:14,color:"#475569",lineHeight:1.7,fontFamily:F}}>• {x}</div>):<div style={{fontSize:14,color:"#475569",fontFamily:F}}>No supera ninguno de los topes evaluados.</div>}<div style={{marginTop:10,fontSize:12,color:"#64748B",fontFamily:F}}>Resultado orientativo. La obligación real depende también de la calidad tributaria y otras condiciones normativas.</div>{rR.ob&&<div style={{marginTop:16,display:"grid",gap:12}}><div style={{padding:16,borderRadius:12,background:"rgba(37,99,235,.06)",border:"1px solid rgba(37,99,235,.12)"}}><div style={{fontSize:14,fontWeight:700,color:"#1D4ED8",marginBottom:8,fontFamily:F}}>Consulte su fecha de declaración según los dos últimos dígitos del NIT</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}><input style={{...IS,maxWidth:180,textAlign:"center",fontSize:18,fontWeight:700,margin:0}} value={rF.nit} onChange={e=>sRF(p=>({...p,nit:e.target.value.replace(/\D/g,"").slice(0,2)}))} placeholder="00" maxLength="2"/><button type="button" onClick={()=>sRR(p=>p?({...p,nitDate:getNitDate(rF.nit)}):p)} style={{padding:"11px 18px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:14,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Consultar</button></div>{rR.nitDate&&<div style={{marginTop:10,fontSize:14,color:"#0F172A",fontFamily:F}}>Su fecha estimada de presentación es: <strong>{rR.nitDate} de 2026</strong>.</div>}</div><div style={{padding:16,borderRadius:14,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><div style={{fontSize:16,fontWeight:700,fontFamily:F,marginBottom:6}}>Programa la presentación y declaración de renta con tiempo y evita sanciones.</div><a href={wm("Hola CONTARAE, estoy obligado a declarar renta y quiero programar mi presentación con asesoría profesional.")} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:10,padding:"11px 18px",borderRadius:10,background:"#25D366",color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none",fontFamily:F}}>Solicitar asesoría por WhatsApp</a></div></div>}</div>}
      <ToolCTA text="Un error en la interpretación de los topes puede salir costoso. Revise su caso con tiempo y evite sanciones o declaraciones innecesarias." msg="Hola CONTARAE, quiero que revisen si estoy obligado a declarar renta y me asesoren en el proceso."/>
    </div>
  )
}

function ToolRet({uv25,uv26}){
  const[yr,sYr]=useState(2025);
  const vals=yr===2025?{uv:uv25,smlmv:1300000}:{uv:uv26,smlmv:1750905};
  const {uv,smlmv}=vals;
  const[d,sD]=useState({ing:""});
  const[x,sX]=useState({vol:"",afc:"",med:"",intViv:"",dep:false,otras:""});
  const[r,sR]=useState(null);
  const calc=()=>{const ingreso=pN(d.ing); if(ingreso<=0) return; const salud=Math.round(ingreso*0.04); const pension=Math.round(ingreso*0.04); const solidaridad=Math.round(ingreso*fspRate(ingreso,smlmv)); const incr=salud+pension+solidaridad; const subtotalA=Math.max(0, ingreso-incr); const combinedCap=Math.min(Math.round(ingreso*0.30), Math.round(yearlyCaps.volAfc*uv)); const volReq=pN(x.vol), afcReq=pN(x.afc); const vol=Math.min(volReq,combinedCap); const afc=Math.min(afcReq,Math.max(0,combinedCap-vol)); const rentEx=vol+afc; const med=Math.min(pN(x.med),Math.round(16*uv)); const dep=x.dep?Math.min(Math.round(ingreso*0.10),Math.round(32*uv)):0; const intViv=Math.min(pN(x.intViv),Math.round(100*uv)); const otras=pN(x.otras); const ded=med+dep+intViv+otras; const subtotalC=Math.max(0, subtotalA-rentEx-ded); const ex25=Math.min(Math.round(subtotalC*0.25), Math.round(yearlyCaps.rent25*uv)); const requestedBenefits=rentEx+ded+ex25; const cap40=Math.round(subtotalA*0.40); const cap1340=Math.round(yearlyCaps.max40*uv); const acceptedBenefits=Math.min(requestedBenefits,cap40,cap1340); const limited=requestedBenefits>acceptedBenefits; const base=Math.max(0, subtotalA-acceptedBenefits); const u=base/uv; let retUVT=0, rangeLabel="0 a 95 UVT — 0%", formula="0 UVT"; if(u>95&&u<=150){retUVT=(u-95)*0.19; rangeLabel=">95 a 150 UVT — 19%"; formula=`(${u.toFixed(2)} - 95) × 19% = ${retUVT.toFixed(2)} UVT`;} else if(u>150&&u<=360){retUVT=(u-150)*0.28+10; rangeLabel=">150 a 360 UVT — 28%"; formula=`(${u.toFixed(2)} - 150) × 28% + 10 = ${retUVT.toFixed(2)} UVT`;} else if(u>360&&u<=640){retUVT=(u-360)*0.33+69; rangeLabel=">360 a 640 UVT — 33%"; formula=`(${u.toFixed(2)} - 360) × 33% + 69 = ${retUVT.toFixed(2)} UVT`;} else if(u>640&&u<=945){retUVT=(u-640)*0.35+162; rangeLabel=">640 a 945 UVT — 35%"; formula=`(${u.toFixed(2)} - 640) × 35% + 162 = ${retUVT.toFixed(2)} UVT`;} else if(u>945&&u<=2300){retUVT=(u-945)*0.37+268; rangeLabel=">945 a 2.300 UVT — 37%"; formula=`(${u.toFixed(2)} - 945) × 37% + 268 = ${retUVT.toFixed(2)} UVT`;} else if(u>2300){retUVT=(u-2300)*0.39+770; rangeLabel=">2.300 UVT — 39%"; formula=`(${u.toFixed(2)} - 2300) × 39% + 770 = ${retUVT.toFixed(2)} UVT`;} const ret=Math.max(0,Math.round(retUVT*uv)); sR({ingreso,salud,pension,solidaridad,incr,subtotalA,volReq,afcReq,vol,afc,rentEx,med,dep,intViv,otras,ded,subtotalC,ex25,requestedBenefits,cap40,cap1340,acceptedBenefits,limited,base,baseUVT:u,retUVT,ret,rangeLabel,formula,tasa:ingreso?((ret/ingreso)*100).toFixed(2):"0.00",neto:ingreso-ret,uv});};
  return(<div style={PANEL}><h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>Retención en la fuente</h3><div style={{display:"flex",gap:8,marginBottom:14}}>{[2025,2026].map(y=><button type="button" key={y} onClick={()=>{sYr(y);sR(null);}} style={{flex:1,padding:"12px 0",borderRadius:12,border:"none",cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:15,background:yr===y?"#2563EB":"#E6EEF8",color:yr===y?"#fff":"#1B3A5C"}}>{y}</button>)}</div><div style={{...NOTE_BOX,marginBottom:16}}>Vigencia {yr}. UVT: {cop(uv)} | SMLMV: {cop(smlmv)}. Se depura por bloques: INCR, rentas exentas, deducciones, renta exenta 25% y límite del 40%.</div><div style={{display:"grid",gap:16}}><div style={BLOCK}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>Bloque 1 — INCR</div><div style={{display:"grid",gap:10}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Ingreso mensual bruto</label><input style={IS} value={d.ing} onChange={e=>sD({ing:fmtI(e.target.value)})} placeholder="COP $ 0"/></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}><div><label style={{fontSize:12,fontWeight:700,color:"#64748B",fontFamily:F}}>Salud obligatoria (4%)</label><input readOnly style={AUTO_IS} value={cop(pN(d.ing)*0.04)}/></div><div><label style={{fontSize:12,fontWeight:700,color:"#64748B",fontFamily:F}}>Pensión obligatoria (4%)</label><input readOnly style={AUTO_IS} value={cop(pN(d.ing)*0.04)}/></div><div><label style={{fontSize:12,fontWeight:700,color:"#64748B",fontFamily:F}}>Fondo de solidaridad</label><input readOnly style={AUTO_IS} value={cop(pN(d.ing)*fspRate(pN(d.ing),smlmv))}/></div></div></div></div><div style={BLOCK}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>Bloque 2 — Rentas exentas</div><div style={{display:"grid",gap:10,gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))"}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Aportes voluntarios a pensión</label><div style={{fontSize:12,color:"#64748B",margin:"3px 0 6px",fontFamily:F}}>Tope conjunto con AFC: 30% del ingreso y hasta {cop(yearlyCaps.volAfc*uv)} al mes.</div><input style={IS} value={x.vol} onChange={e=>sX(p=>({...p,vol:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Aportes AFC</label><div style={{fontSize:12,color:"#64748B",margin:"3px 0 6px",fontFamily:F}}>Comparte el mismo tope con voluntarios.</div><input style={IS} value={x.afc} onChange={e=>sX(p=>({...p,afc:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div></div></div><div style={BLOCK}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>Bloque 3 — Deducciones</div><div style={{display:"grid",gap:10,gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))"}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Medicina prepagada</label><div style={{fontSize:12,color:"#64748B",margin:"3px 0 6px",fontFamily:F}}>Tope 16 UVT = {cop(16*uv)}.</div><input style={IS} value={x.med} onChange={e=>sX(p=>({...p,med:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Intereses de vivienda</label><div style={{fontSize:12,color:"#64748B",margin:"3px 0 6px",fontFamily:F}}>Tope 100 UVT = {cop(100*uv)}.</div><input style={IS} value={x.intViv} onChange={e=>sX(p=>({...p,intViv:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><div><label style={{display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}><input type="checkbox" checked={x.dep} onChange={e=>sX(p=>({...p,dep:e.target.checked}))} style={{accentColor:"#2563EB",width:18,height:18}}/>Dependientes</label><div style={{fontSize:12,color:"#64748B",marginTop:6,fontFamily:F}}>10% del ingreso bruto, máximo 32 UVT = {cop(32*uv)}.</div></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Otras deducciones</label><input style={IS} value={x.otras} onChange={e=>sX(p=>({...p,otras:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div></div></div><button type="button" onClick={calc} style={{padding:"13px 20px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Calcular retención</button></div>{r&&<div style={{marginTop:18,display:"grid",gap:14}}>{[{title:"Bloque 1 — INCR",rows:[["Ingreso bruto",r.ingreso],["Salud 4%",r.salud],["Pensión 4%",r.pension],["Fondo de solidaridad",r.solidaridad],["Subtotal INCR",r.incr],["Subtotal (A)",r.subtotalA]]},{title:"Bloque 2 — Rentas exentas",rows:[["Voluntarios solicitados",r.volReq],["Voluntarios aceptados",r.vol],["AFC solicitado",r.afcReq],["AFC aceptado",r.afc],["Subtotal rentas exentas",r.rentEx]]},{title:"Bloque 3 — Deducciones",rows:[["Medicina prepagada",r.med],["Dependientes",r.dep],["Intereses vivienda",r.intViv],["Otras deducciones",r.otras],["Subtotal deducciones",r.ded],["Subtotal (C)",r.subtotalC]]},{title:"Bloque 4 y 5 — Renta exenta 25% y límite 40%",rows:[["Renta exenta 25%",r.ex25],["Beneficios solicitados",r.requestedBenefits],["Límite 40%",r.cap40],["Límite 1.340 UVT anuales",r.cap1340],["Valor aceptado",r.acceptedBenefits]]}].map((block,idx)=><div key={idx} style={{...BLOCK,background:"#fff"}}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>{block.title}</div><div style={{display:"grid",gap:8}}>{block.rows.map(([label,val],j)=><div key={j} style={{display:"flex",justifyContent:"space-between",gap:12,fontSize:14,fontFamily:F,color:"#334155"}}><span>{label}</span><strong>{cop(val)}</strong></div>)}</div></div>)}{r.limited&&<div style={{padding:14,borderRadius:12,background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.14)",fontSize:13,color:"#B91C1C",fontFamily:F}}>Se aplicó el límite del 40% del artículo 388 ET.</div>}<div style={{padding:22,borderRadius:16,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><div style={{display:"grid",gap:8,fontFamily:F}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Base gravable</span><strong>{cop(r.base)}</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Base en UVT</span><strong>{r.baseUVT.toFixed(2)} UVT</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Rango aplicado</span><strong>{r.rangeLabel}</strong></div><div style={{fontSize:13,color:"rgba(255,255,255,.78)",lineHeight:1.7}}>Fórmula: {r.formula}</div><div style={{fontSize:13,color:"rgba(255,255,255,.78)"}}>Retención en pesos: {r.retUVT.toFixed(2)} UVT × {cop(r.uv)} = {cop(r.ret)}</div><div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid rgba(255,255,255,.15)"}}><span style={{fontSize:16}}>Retención estimada</span><strong style={{fontSize:22,color:"#60A5FA"}}>{cop(r.ret)}</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Tasa efectiva</span><strong>{r.tasa}%</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Neto después de retención</span><strong>{cop(r.neto)}</strong></div></div></div></div>}<ToolCTA text="Una retención mal calculada puede afectar su flujo de caja y generar diferencias tributarias innecesarias. Revísela con apoyo profesional antes de presentarla." msg="Hola CONTARAE, necesito ayuda para liquidar correctamente mi retención en la fuente y validar topes, deducciones y rentas exentas."/></div>)}

function ToolPlan(){
  const[yr,sYr]=useState(2025);const smlmv=yr===2025?1300000:1750905;const[d,sD]=useState({ing:"",arl:"1"});const[r,sR]=useState(null);
  const calc=()=>{const ing=pN(d.ing);if(ing<=0)return;const ibcRaw=Math.round(ing*.40);const ibc=Math.max(smlmv,Math.min(ibcRaw,25*smlmv));const salud=Math.round(ibc*.125);const pension=Math.round(ibc*.16);const solidaridad=Math.round(ibc*fspRate(ibc,smlmv));const arl=Math.round(ibc*riskRates[d.arl]);sR({ing,ibcRaw,ibc,salud,pension,solidaridad,arl,total:salud+pension+solidaridad+arl});};
  return(<div style={PANEL}><h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>Planilla independientes / contratistas</h3><div style={{display:"flex",gap:8,marginBottom:14}}>{[2025,2026].map(y=><button type="button" key={y} onClick={()=>{sYr(y);sR(null);}} style={{flex:1,padding:"12px 0",borderRadius:12,border:"none",cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:15,background:yr===y?"#2563EB":"#E6EEF8",color:yr===y?"#fff":"#1B3A5C"}}>{y}</button>)}</div><div style={{...NOTE_BOX,marginBottom:16}}>Vigencia {yr}. SMLMV: {cop(smlmv)} | IBC mínimo: {cop(smlmv)} | IBC máximo: {cop(25*smlmv)}. El fondo de solidaridad aplica desde 4 SMLMV.</div><div style={{display:"grid",gap:12}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Ingresos u honorarios mensuales</label><input style={IS} value={d.ing} onChange={e=>sD(p=>({...p,ing:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Nivel de riesgo ARL</label><select style={{...IS,cursor:"pointer"}} value={d.arl} onChange={e=>sD(p=>({...p,arl:e.target.value}))}>{Object.keys(riskLabels).map(k=><option key={k} value={k}>{riskLabels[k]}</option>)}</select></div><button type="button" onClick={calc} style={{padding:"13px 20px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Calcular planilla</button></div>{r&&<div style={{marginTop:18,display:"grid",gap:14}}><div style={BLOCK}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>Base de cotización</div><div style={{display:"grid",gap:8}}>{[["Ingresos",r.ing],["IBC teórico (40%)",r.ibcRaw],["IBC aplicado",r.ibc]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:14,fontFamily:F}}><span>{l}</span><strong>{cop(v)}</strong></div>)}</div></div><div style={BLOCK}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>Aportes mensuales</div><div style={{display:"grid",gap:8}}>{[["Salud 12,5%",r.salud],["Pensión 16%",r.pension],[`ARL ${riskLabels[d.arl]}`,r.arl],["Fondo de solidaridad",r.solidaridad],["Total a pagar",r.total]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:14,fontFamily:F}}><span>{l}</span><strong>{cop(v)}</strong></div>)}</div></div></div>}<ToolCTA text="Pagar de más o de menos en su planilla puede generar reprocesos, intereses o requerimientos. Le ayudamos a liquidarla correctamente." msg="Hola CONTARAE, necesito apoyo con la liquidación de mi planilla como independiente."/></div>)
}
function ToolNom(){
  const[yr,sYr]=useState(2025);const cfg=yr===2025?{smlmv:1300000,auxT:200000}:{smlmv:1750905,auxT:249095};const[d,sD]=useState({sal:"",dias:"30",arl:"1",tipoEmp:"juridica",nEmp:"3"});const[r,sR]=useState(null);
  const calc=()=>{const s=pN(d.sal),dias=Math.min(30,Math.max(1,parseInt(d.dias)||30));if(s<=0)return;const salarioProp=Math.round(s*dias/30);const aux=s<2*cfg.smlmv?Math.round(cfg.auxT*dias/30):0;const dev=salarioProp+aux;const dedSal=Math.round(salarioProp*.04),dedPen=Math.round(salarioProp*.04),fsp=Math.round(salarioProp*fspRate(s,cfg.smlmv));const neto=dev-(dedSal+dedPen+fsp);const empSal=Math.round(salarioProp*.085),empPen=Math.round(salarioProp*.12),empArl=Math.round(salarioProp*riskRates[d.arl]);const numEmp=parseInt(d.nEmp)||0;const aplicaExon=(d.tipoEmp==='juridica' && s<10*cfg.smlmv) || (d.tipoEmp==='natural' && numEmp>2 && s<10*cfg.smlmv);const sena=aplicaExon?0:Math.round(salarioProp*.02),icbf=aplicaExon?0:Math.round(salarioProp*.03),caja=Math.round(salarioProp*.04);const basePrest=salarioProp+aux,prima=Math.round(basePrest*.0833),ces=Math.round(basePrest*.0833),intCes=Math.round(ces*.12),vac=Math.round(salarioProp*.0417);sR({salarioProp,aux,dev,dedSal,dedPen,fsp,neto,empSal,empPen,empArl,sena,icbf,caja,prima,ces,intCes,vac,costoTotal:dev+empSal+empPen+empArl+sena+icbf+caja+prima+ces+intCes+vac,aplicaExon});};
  return(<div style={PANEL}><h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>Liquidador de nómina</h3><div style={{display:"flex",gap:8,marginBottom:14}}>{[2025,2026].map(y=><button type="button" key={y} onClick={()=>{sYr(y);sR(null);}} style={{flex:1,padding:"12px 0",borderRadius:12,border:"none",cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:15,background:yr===y?"#2563EB":"#E6EEF8",color:yr===y?"#fff":"#1B3A5C"}}>{y}</button>)}</div><div style={{...NOTE_BOX,marginBottom:16}}>Vigencia {yr}. SMLMV: {cop(cfg.smlmv)} | Auxilio de transporte: {cop(cfg.auxT)}. La exoneración de SENA e ICBF se valida automáticamente para trabajadores que devengan menos de 10 SMLMV, según el tipo de empleador y el número de trabajadores cuando aplique.</div><div style={{display:"grid",gap:12}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Salario mensual base</label><input style={IS} value={d.sal} onChange={e=>sD(p=>({...p,sal:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Días trabajados</label><input style={IS} value={d.dias} onChange={e=>sD(p=>({...p,dias:e.target.value.replace(/\D/g,"")}))} placeholder="30"/></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Nivel de riesgo ARL</label><select style={{...IS,cursor:"pointer"}} value={d.arl} onChange={e=>sD(p=>({...p,arl:e.target.value}))}>{Object.keys(riskLabels).map(k=><option key={k} value={k}>{riskLabels[k]}</option>)}</select></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Tipo de empleador</label><select style={{...IS,cursor:"pointer"}} value={d.tipoEmp} onChange={e=>sD(p=>({...p,tipoEmp:e.target.value}))}><option value="juridica">Sociedad o persona jurídica</option><option value="natural">Persona natural empleadora</option></select></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Número de trabajadores</label><input style={IS} value={d.nEmp} onChange={e=>sD(p=>({...p,nEmp:e.target.value.replace(/\D/g,"")}))} placeholder="3"/></div></div><button type="button" onClick={calc} style={{padding:"13px 20px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Calcular nómina</button></div>{r&&<div style={{marginTop:18,display:"grid",gap:14}}>{[{t:"Devengado",rows:[["Salario proporcional",r.salarioProp],["Auxilio de transporte",r.aux],["Subtotal devengado",r.dev]]},{t:"Deducciones trabajador",rows:[["Salud 4%",r.dedSal],["Pensión 4%",r.dedPen],["Fondo de solidaridad",r.fsp],["Neto a pagar",r.neto]]},{t:"Aportes empleador",rows:[["Salud 8,5%",r.empSal],["Pensión 12%",r.empPen],[`ARL ${riskLabels[d.arl]}`,r.empArl]]},{t:"Parafiscales",rows:[["SENA",r.sena],["ICBF",r.icbf],["Caja de compensación",r.caja],["Exoneración aplicada",r.aplicaExon?"Sí":"No"]]},{t:"Prestaciones sociales",rows:[["Prima",r.prima],["Cesantías",r.ces],["Intereses de cesantías",r.intCes],["Vacaciones",r.vac]]}].map((b,i)=><div key={i} style={BLOCK}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>{b.t}</div><div style={{display:"grid",gap:8}}>{b.rows.map(([l,v],j)=><div key={j} style={{display:"flex",justifyContent:"space-between",fontSize:14,fontFamily:F}}><span>{l}</span><strong>{typeof v==='string'?v:cop(v)}</strong></div>)}</div></div>)}<div style={{padding:22,borderRadius:16,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff",display:"grid",gap:8,fontFamily:F}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Costo total empresa</span><strong style={{fontSize:22,color:"#60A5FA"}}>{cop(r.costoTotal)}</strong></div></div></div>}<ToolCTA text="Una nómina mal liquidada puede afectar costos, aportes y cumplimiento laboral. Reciba apoyo para hacerlo correctamente." msg="Hola CONTARAE, necesito apoyo con la liquidación de nómina y seguridad social."/></div>)
}
function ToolIVA(){
  const[d,sD]=useState({base:"",tar:"19"});const[r,sR]=useState(null);
  const calc=()=>{const b=pN(d.base),t=parseFloat(d.tar)/100,iva=Math.round(b*t);sR({b,iva,tot:b+iva,tar:d.tar});};
  return(<div style={PANEL}><h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>Calculadora de IVA</h3><div style={{...NOTE_BOX,marginBottom:16}}>Herramienta informativa con tarifas de referencia 0%, 5% y 19%.</div><div style={{display:"grid",gap:12}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Base gravable</label><input style={IS} value={d.base} onChange={e=>sD(p=>({...p,base:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Tarifa</label><select style={{...IS,cursor:"pointer"}} value={d.tar} onChange={e=>sD(p=>({...p,tar:e.target.value}))}><option value="0">0%</option><option value="5">5%</option><option value="19">19%</option></select></div><button type="button" onClick={calc} style={{padding:"13px 20px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Calcular IVA</button></div>{r&&<div style={{marginTop:18,padding:22,borderRadius:16,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff",display:"grid",gap:8,fontFamily:F}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Base gravable</span><strong>{cop(r.b)}</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Tarifa</span><strong>{r.tar}%</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>IVA</span><strong style={{color:"#60A5FA"}}>{cop(r.iva)}</strong></div><div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid rgba(255,255,255,.15)"}}><span style={{fontSize:16}}>Total con IVA</span><strong style={{fontSize:22}}>{cop(r.tot)}</strong></div></div>}<ToolCTA text="Un IVA mal calculado afecta sus cobros, márgenes y cumplimiento. Reciba apoyo para facturar con mayor seguridad." msg="Hola CONTARAE, necesito apoyo para calcular correctamente el IVA de mis operaciones."/></div>)
}
function ToolPrIVA(){
  const[d,sD]=useState({total:"",tar:"19"});const[r,sR]=useState(null);
  const calc=()=>{const t=pN(d.total),tr=parseFloat(d.tar)/100,base=t>0?Math.round(t/(1+tr)):0,iva=t-base;sR({t,base,iva,tar:d.tar});};
  return(<div style={PANEL}><h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>Precio antes de IVA</h3><div style={{...NOTE_BOX,marginBottom:16}}>Desglosa un valor total para identificar la base antes de IVA y el IVA incluido. Tarifas disponibles: 5% y 19%.</div><div style={{display:"grid",gap:12}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Precio total (IVA incluido)</label><input style={IS} value={d.total} onChange={e=>sD(p=>({...p,total:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Tarifa</label><select style={{...IS,cursor:"pointer"}} value={d.tar} onChange={e=>sD(p=>({...p,tar:e.target.value}))}><option value="5">5%</option><option value="19">19%</option></select></div><button type="button" onClick={calc} style={{padding:"13px 20px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Desglosar valor</button></div>{r&&<div style={{marginTop:18,padding:22,borderRadius:16,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff",display:"grid",gap:8,fontFamily:F}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Valor total</span><strong>{cop(r.t)}</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Tarifa</span><strong>{r.tar}%</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Precio antes de IVA</span><strong>{cop(r.base)}</strong></div><div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid rgba(255,255,255,.15)"}}><span style={{fontSize:16}}>IVA incluido</span><strong style={{fontSize:22,color:"#60A5FA"}}>{cop(r.iva)}</strong></div></div>}<ToolCTA text="Desglosar mal un precio puede afectar su rentabilidad y sus cotizaciones. Le ayudamos a estructurar correctamente sus valores antes de IVA." msg="Hola CONTARAE, necesito apoyo para desglosar precios antes de IVA."/></div>)
}

const TLC=[
  {m:"Renta",c:"#2563EB",items:[
    "Grandes contribuyentes: pago 1a cuota en febrero, declaración y pago 2a cuota en abril, pago 3a cuota en junio.",
    "Personas jurídicas: declaración y pago 1a cuota en mayo y pago 2a cuota en julio.",
    "Personas naturales: declaración y pago entre el 12 de agosto y el 26 de octubre según los dos últimos dígitos del NIT."
  ]},
  {m:"IVA",c:"#0EA5E9",items:[
    "Bimestral: vencimientos en marzo, mayo, julio, septiembre, noviembre y enero de 2027.",
    "Cuatrimestral: vencimientos en mayo, septiembre y enero de 2027.",
    "Consulte el período aplicable según su responsabilidad y periodicidad registrada ante la DIAN."
  ]},
  {m:"Retefuente",c:"#1D4ED8",items:[
    "Declaración y pago mensual durante todo el año gravable 2026.",
    "Los vencimientos varían según el último dígito del NIT.",
    "Una presentación extemporánea puede generar sanciones e intereses."
  ]},
  {m:"Otros",c:"#3B82F6",items:[
    "También existen vencimientos para RST, impuesto al patrimonio, activos en el exterior y RUB.",
    "Las fechas exactas dependen del tipo de obligación y del último dígito del NIT cuando aplique.",
    "Si necesita confirmar su obligación o fecha exacta, solicite asesoría personalizada."
  ]}
];

function TlS(){
const getNitDates=(n)=>{if(n.length<1)return null;const d=parseInt(n);const rentaPN=[{r:"01-02",f:"12 ago"},{r:"03-04",f:"13 ago"},{r:"05-06",f:"14 ago"},{r:"07-08",f:"18 ago"},{r:"09-10",f:"19 ago"},{r:"11-12",f:"20 ago"},{r:"13-14",f:"21 ago"},{r:"15-16",f:"24 ago"},{r:"17-18",f:"25 ago"},{r:"19-20",f:"26 ago"},{r:"21-22",f:"27 ago"},{r:"23-24",f:"28 ago"},{r:"25-26",f:"31 ago"},{r:"27-28",f:"1 sep"},{r:"29-30",f:"2 sep"},{r:"31-32",f:"3 sep"},{r:"33-34",f:"4 sep"},{r:"35-36",f:"7 sep"},{r:"37-38",f:"8 sep"},{r:"39-40",f:"9 sep"},{r:"41-42",f:"10 sep"},{r:"43-44",f:"11 sep"},{r:"45-46",f:"14 sep"},{r:"47-48",f:"15 sep"},{r:"49-50",f:"16 sep"},{r:"51-52",f:"17 sep"},{r:"53-54",f:"18 sep"},{r:"55-56",f:"21 sep"},{r:"57-58",f:"22 sep"},{r:"59-60",f:"23 sep"},{r:"61-62",f:"24 sep"},{r:"63-64",f:"25 sep"},{r:"65-66",f:"28 sep"},{r:"67-68",f:"1 oct"},{r:"69-70",f:"2 oct"},{r:"71-72",f:"5 oct"},{r:"73-74",f:"6 oct"},{r:"75-76",f:"7 oct"},{r:"77-78",f:"8 oct"},{r:"79-80",f:"9 oct"},{r:"81-82",f:"13 oct"},{r:"83-84",f:"14 oct"},{r:"85-86",f:"15 oct"},{r:"87-88",f:"16 oct"},{r:"89-90",f:"19 oct"},{r:"91-92",f:"20 oct"},{r:"93-94",f:"21 oct"},{r:"95-96",f:"22 oct"},{r:"97-98",f:"23 oct"},{r:"99-00",f:"26 oct"}];
const match=rentaPN.find(r=>{const[a,b]=r.r.split("-");return d>=parseInt(a)&&d<=parseInt(b);});return match?match.f:null;};
return(<Sec id="calendario" title="Calendario tributario DIAN 2026" sub="OBLIGACIONES TRIBUTARIAS" bg={B[7]}><p style={{textAlign:"center",fontSize:14,color:"#5A6F8A",marginTop:-18,marginBottom:16,fontFamily:F}}>Decreto 2229 de 2023. Fuente: www.dian.gov.co</p>
<div style={{maxWidth:760,margin:"0 auto 24px",...NOTE_BOX}}>Consulte aquí el resumen general de fechas tributarias 2026. La búsqueda específica de renta para personas naturales por los dos últimos dígitos del NIT se muestra ahora dentro de la herramienta ¿Debe declarar renta?, solo cuando el resultado indica que sí existe obligación.</div>
<div style={{display:"grid",gap:14,maxWidth:800,margin:"0 auto"}}>{TLC.map((t,i)=><div key={i} style={{display:"flex",gap:16,alignItems:"flex-start"}}><div style={{minWidth:76,textAlign:"center"}}><div style={{fontSize:17,fontWeight:700,color:t.c,fontFamily:FH}}>{t.m}</div><div style={{width:3,height:40,background:t.c,margin:"6px auto",borderRadius:4,opacity:.3}}/></div><Cd s={{flex:1,padding:18,borderRadius:16,background:"#fff",borderLeft:`4px solid ${t.c}`}}>{t.items.map((item,j)=><div key={j} style={{fontSize:14,color:"#3a5068",lineHeight:1.75,fontFamily:F,padding:"2px 0"}}>• {item}</div>)}</Cd></div>)}</div>
<p style={{textAlign:"center",marginTop:20,fontSize:13,color:"#5A6F8A",fontFamily:F}}>Fuente: Calendario Tributario DIAN 2026 — Decreto 2229 de 2023. <a href={wm("Hola CONTARAE, necesito conocer mis fechas tributarias específicas.")} target="_blank" rel="noopener noreferrer" style={{color:"#2563EB",fontWeight:600,textDecoration:"none"}}>Consulte sus fechas →</a></p></Sec>)}

/* ══════ ALERTS ══════ */
function AltS(){return(<Sec id="alertas" title="Alertas y novedades tributarias" sub="NOTICIAS" bg={B[0]}><div style={{display:"grid",gap:12,maxWidth:800,margin:"0 auto"}}>{[
  {tag:"Urgente",t:"Declaración de renta personas naturales 2026: del 12 de agosto al 26 de octubre",d:"Abril 2026",cl:"#DC2626",bg:"rgba(220,38,38,.07)"},
  {tag:"Importante",t:"Información exógena: grandes contribuyentes del 28 abril al 13 mayo 2026",d:"Abril 2026",cl:"#D97706",bg:"rgba(217,119,6,.07)"},
  {tag:"DIAN",t:"UVT 2026: $52.374 — Nuevos topes aplicables",d:"Marzo 2026",cl:"#2563EB",bg:"rgba(37,99,235,.07)"},
  {tag:"Normativo",t:"Reforma Laboral 2025 (Ley 2466): impacto en nómina y prestaciones",d:"Marzo 2026",cl:"#2563EB",bg:"rgba(37,99,235,.07)"},
  {tag:"DIAN",t:"Topes declarar renta año gravable 2025: UVT $49.799",d:"Febrero 2026",cl:"#2563EB",bg:"rgba(37,99,235,.07)"},
  {tag:"Informativo",t:"Renovación matrícula mercantil vencida 31 marzo. Gestione renovación extemporánea",d:"Abril 2026",cl:"#5A6F8A",bg:"rgba(90,111,138,.07)"}
].map((a,i)=><Cd key={i} s={{padding:"18px 22px",borderRadius:12,background:"#fff",display:"flex",gap:14,alignItems:"flex-start"}}><span style={{fontSize:11,fontWeight:700,color:a.cl,background:a.bg,padding:"4px 10px",borderRadius:100,fontFamily:F,whiteSpace:"nowrap"}}>{a.tag}</span><div style={{flex:1}}><h4 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",lineHeight:1.55,fontFamily:F}}>{a.t}</h4><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}><span style={{fontSize:12,color:"#7A8FA8",fontFamily:F}}>{a.d}</span><a href={wm(`Hola CONTARAE, necesito ayuda con: ${a.t}`)} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Necesito ayuda →</a></div></div></Cd>)}</div></Sec>)}

/* ══════ ABOUT ══════ */
function Abt(){return(<Sec id="nosotros" title="Conozca a CONTARAE" sub="NOSOTROS" bg={B[1]} narrow>
<div style={{padding:28,borderRadius:15,background:"#fff",border:"1px solid rgba(37,99,235,.12)",marginBottom:18}}><h3 style={{fontSize:18,fontWeight:700,color:"#0B1D3A",marginBottom:10,fontFamily:F}}>¿Quiénes somos?</h3><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.85,fontFamily:F}}>CONTARAE es una firma de servicios contables, tributarios y financieros fundada con el propósito de brindar soluciones profesionales y accesibles a microempresas, emprendedores, pymes y personas naturales en Colombia. Contamos con Contadores Públicos certificados con tarjeta profesional vigente y amplia experiencia en diversos sectores.</p><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.85,fontFamily:F,marginTop:12}}>Nos especializamos en outsourcing contable, asesoría tributaria, gestión financiera y certificaciones contables. Cada cliente recibe un servicio personalizado, cercano y confidencial.</p></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:14,marginBottom:18}}>{[["500+","Clientes atendidos"],["1.000+","Certificaciones emitidas"],["10+","Años de experiencia"],["100%","Compromiso profesional"]].map(([n,l],i)=><div key={i} style={{textAlign:"center",padding:18,borderRadius:12,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)"}}><div style={{fontSize:26,fontWeight:700,color:"#60A5FA",fontFamily:FH}}>{n}</div><div style={{fontSize:12,color:"rgba(255,255,255,.65)",fontFamily:F,marginTop:4}}>{l}</div></div>)}</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:16,marginBottom:18}}><div style={{padding:24,borderRadius:13,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><h3 style={{fontSize:16,fontWeight:700,marginBottom:8,fontFamily:F}}>Misión</h3><p style={{fontSize:14,lineHeight:1.8,opacity:.9,fontFamily:F}}>Brindar servicios contables de alta calidad con responsabilidad y transparencia, contribuyendo al crecimiento sostenible de nuestros clientes mediante soluciones integrales y personalizadas.</p></div><div style={{padding:24,borderRadius:13,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff"}}><h3 style={{fontSize:16,fontWeight:700,marginBottom:8,fontFamily:F}}>Visión</h3><p style={{fontSize:14,lineHeight:1.8,opacity:.9,fontFamily:F}}>Ser firma líder en servicios contables y financieros en Colombia, por innovación, profesionalismo y la confianza que generamos como aliado estratégico de largo plazo.</p></div></div>
<div style={{padding:24,borderRadius:13,background:"#fff",border:"1px solid rgba(37,99,235,.12)",marginBottom:18}}><h3 style={{fontSize:16,fontWeight:700,color:"#0B1D3A",marginBottom:12,fontFamily:F}}>Valores</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>{[["Transparencia","Comunicación clara y veraz en cada interacción."],["Responsabilidad","Cumplimiento oportuno de cada compromiso."],["Confidencialidad","Protección absoluta de su información."],["Excelencia","Calidad y rigor técnico en cada servicio."],["Compromiso","Su éxito financiero es nuestra prioridad."],["Ética","Integridad y apego a la normatividad."]].map(([v,d],i)=><div key={i} style={{padding:"12px 14px",borderRadius:9,background:"rgba(37,99,235,.04)"}}><div style={{fontSize:14,fontWeight:700,color:"#1B3A5C",fontFamily:F}}>✦ {v}</div><div style={{fontSize:13,color:"#5A6F8A",marginTop:3,fontFamily:F}}>{d}</div></div>)}</div></div>
<div style={{padding:24,borderRadius:13,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><h3 style={{fontSize:16,fontWeight:700,marginBottom:8,fontFamily:F}}>Nuestro Compromiso</h3><p style={{fontSize:15,lineHeight:1.85,opacity:.9,fontFamily:F}}>En CONTARAE entendemos que detrás de cada número hay un esfuerzo, un proyecto de vida y una familia. Por eso tratamos cada caso con la misma dedicación como si fuera el nuestro. Su tranquilidad financiera es nuestra prioridad.</p><a href={wm("Hola CONTARAE, me gustaría conocer más sobre sus servicios.")} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:14,padding:"10px 22px",borderRadius:10,background:"#60A5FA",color:"#fff",fontSize:14,fontWeight:600,textDecoration:"none",fontFamily:F}}>Conózcanos más →</a></div></Sec>)}

/* ══════ BLOG ══════ */
const BLG=[{title:"Declaración de renta PN 2026",tag:"Tributario",date:"Abr 2026",ex:"Conozca topes, plazos, soportes y sanciones para cumplir con su declaración del año gravable 2025 sin contratiempos.",content:"La declaración de renta de personas naturales en 2026 exige revisar topes de ingresos, patrimonio, compras, consumos y movimientos bancarios. Además de conocer las fechas oficiales, conviene preparar con tiempo certificados de ingresos, extractos, soportes de inversiones, deudas y deducciones. Una revisión previa evita sanciones por extemporaneidad, omisión o inexactitud y le permite planear mejor su flujo de caja antes de presentar y pagar ante la DIAN."},{title:"Renovación matrícula mercantil",tag:"Empresarial",date:"Mar 2026",ex:"Revise requisitos, plazo máximo, costos y consecuencias de no renovar oportunamente su registro mercantil.",content:"La renovación de matrícula mercantil debe gestionarse cada año dentro del plazo legal. No hacerlo puede generar sanciones, afectar la reputación comercial de la empresa y complicar trámites bancarios, contractuales y societarios. Tener actualizada la información en Cámara de Comercio también facilita la formalización del negocio y la participación en procesos de contratación o validación ante terceros."},{title:"Certificación de ingresos",tag:"Certificaciones",date:"Mar 2026",ex:"Le explicamos qué soportes se necesitan, cómo se determina la tarifa y en qué casos la solicitan bancos, inmobiliarias o embajadas.",content:"La certificación de ingresos debe elaborarse con soportes suficientes y coherentes con la realidad económica del solicitante. Dependiendo del tipo de ingreso, pueden requerirse desprendibles de nómina, facturas, contratos, extractos, certificados de inversiones o documentos de arriendo. Una certificación bien preparada brinda confianza al tercero que la recibe y reduce devoluciones o requerimientos adicionales."},{title:"Facturación electrónica",tag:"Tributario",date:"Feb 2026",ex:"Obligaciones, requisitos técnicos y puntos clave para implementar o actualizar su facturación electrónica correctamente.",content:"La facturación electrónica no es solo un requisito formal: impacta el control del ingreso, la trazabilidad de la operación y el cumplimiento ante la DIAN. Es importante validar numeración, habilitación, proveedor tecnológico, certificado digital y consistencia entre facturas, notas crédito y reportes contables. Una implementación adecuada evita rechazos, errores de transmisión y diferencias tributarias posteriores."},{title:"5 errores contabilidad pymes",tag:"Contable",date:"Ene 2026",ex:"Errores frecuentes en pequeñas empresas y recomendaciones prácticas para evitarlos desde la operación diaria.",content:"Entre los errores más comunes están mezclar finanzas personales con las del negocio, no conciliar bancos, no conservar soportes, no revisar impuestos periódicamente y no interpretar indicadores financieros. Corregir estos puntos mejora la visibilidad del negocio, permite tomar mejores decisiones y disminuye riesgos tributarios y contables con el paso del tiempo."},{title:"Información exógena DIAN",tag:"Tributario",date:"Ene 2026",ex:"Qué es, quiénes deben presentarla, qué información reporta y por qué conviene prepararla con anticipación.",content:"La información exógena o medios magnéticos exige consolidar operaciones con terceros, pagos, retenciones, ingresos y otros movimientos reportables. Prepararla con anticipación ayuda a depurar bases, corregir inconsistencias y evitar sanciones derivadas de errores, omisiones o reportes tardíos. Es una obligación sensible porque cruza información relevante con otras declaraciones y reportes frente a la DIAN."}];
function BlgS(){const[exp,sE]=useState(null);return(<Sec id="blog" title="Artículos y guías" sub="BLOG" bg={B[2]}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:18}}>{BLG.map((p,i)=><Cd key={i} s={{borderRadius:16,overflow:"hidden",padding:0,background:"#fff"}}><div style={{padding:22}}><div style={{display:"flex",gap:6,marginBottom:8}}><span style={{fontSize:10,fontWeight:600,color:"#2563EB",background:"rgba(37,99,235,.06)",padding:"3px 9px",borderRadius:100,fontFamily:F}}>{p.tag}</span><span style={{fontSize:10,color:"#7A8FA8",fontFamily:F}}>{p.date}</span></div><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:6,lineHeight:1.45,fontFamily:F}}>{p.title}</h3><p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.7,fontFamily:F}}>{p.ex}</p><button onClick={()=>sE(exp===i?null:i)} style={{marginTop:10,fontSize:13,color:"#2563EB",fontWeight:600,fontFamily:F,background:"none",border:"none",cursor:"pointer",padding:0}}>{exp===i?"Cerrar ✕":"Leer más →"}</button></div>{exp===i&&<div style={{padding:"0 22px 22px",borderTop:"1px solid rgba(37,99,235,.05)"}}><div style={{paddingTop:14,fontSize:14,color:"#3a5068",lineHeight:1.9,fontFamily:F,whiteSpace:"pre-line"}}>{p.content}</div><div style={{marginTop:14,padding:12,borderRadius:8,background:"rgba(37,99,235,.04)"}}><a href={wm(`Hola CONTARAE, necesito ayuda con: ${p.title}`)} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Consultar por WhatsApp →</a></div></div>}</Cd>)}</div></Sec>)}

/* ══════ DOWNLOADS ══════ */
const DL=[{n:"Checklist declaración renta PN",d:"Documentos para declarar renta 2025.",f:"PDF"},{n:"Calendario tributario DIAN 2026",d:"Fechas de todas las obligaciones.",f:"PDF"},{n:"Control ingresos y gastos",d:"Plantilla mensual para independientes.",f:"Excel"},{n:"Conciliación retenciones",d:"Cruce retenciones vs formulario 220.",f:"Excel"},{n:"Control facturación mensual",d:"Facturas con cálculo automático de IVA.",f:"Excel"},{n:"Conciliación bancaria",d:"Compare extracto vs registros contables.",f:"Excel"},{n:"Inventario activos fijos",d:"Activos con depreciación y valor en libros.",f:"Excel"},{n:"Estados financieros pymes",d:"Balance y estado de resultados NIIF.",f:"Excel"},{n:"Liquidación prestaciones",d:"Prima, cesantías, intereses y vacaciones.",f:"Excel"},{n:"Control nómina mensual",d:"Nómina con deducciones y aportes.",f:"Excel"},{n:"Modelo certificación laboral",d:"Formato listo para diligenciar.",f:"Word"},{n:"Guía soportes certificación",d:"Documentos según tipo de ingreso.",f:"PDF"},{n:"Autorización datos personales",d:"Formato Ley 1581/2012.",f:"PDF"},{n:"Solicitud certificación contable",d:"Modelo de solicitud formal.",f:"Word"},{n:"Checklist creación empresa",d:"Requisitos para SAS, LTDA o S.A.",f:"PDF"},{n:"Modelo acta constitución SAS",d:"Acta y estatutos para SAS.",f:"Word"}];
function DwS(){return(<Sec id="descargas" title="Formatos y guías" sub="RECURSOS" bg={B[3]} narrow><div style={{display:"grid",gap:10}}>{DL.map((d,i)=><Cd key={i} s={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderRadius:11,background:"#fff",gap:12,flexWrap:"wrap"}}><div style={{flex:1,minWidth:200}}><h4 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",fontFamily:F}}>{d.n}</h4><p style={{fontSize:13,color:"#5A6F8A",marginTop:2,fontFamily:F}}>{d.d}</p></div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,fontWeight:600,color:"#2563EB",background:"rgba(37,99,235,.07)",padding:"2px 8px",borderRadius:100,fontFamily:F}}>{d.f}</span><a href={wm(`Hola, solicito: ${d.n}`)} target="_blank" rel="noopener noreferrer" style={{padding:"7px 14px",borderRadius:7,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:12,fontWeight:600,textDecoration:"none",fontFamily:F}}>Solicitar</a></div></Cd>)}</div></Sec>)}

/* ══════ FAQ ══════ */
const FQ=[{q:"¿Cuánto cuesta la certificación de ingresos?",a:"La tarifa depende del rango de ingresos acreditados y del nivel de soporte requerido. Siempre informamos el valor antes del pago, para que el cliente sepa exactamente qué incluye el servicio y en qué plazo se entrega el documento firmado por contador público."},{q:"¿Cuánto tarda la entrega del certificado?",a:"Con documentación completa y pago confirmado, normalmente se entrega en pocas horas. Si la información requiere validaciones adicionales o documentos complementarios, el tiempo puede extenderse, pero siempre le informamos el estado del proceso."},{q:"¿Qué soportes necesito para la certificación?",a:"Depende del tipo de ingreso. Para ingresos laborales suelen usarse desprendibles o certificados; para independientes, facturas, contratos, extractos y reportes; para arriendos o inversiones, los soportes que evidencien el flujo real. Lo ideal es que cada ingreso quede respaldado de forma clara y verificable."},{q:"¿La certificación tiene vigencia?",a:"Sí. Aunque no existe una vigencia única para todos los casos, usualmente las entidades receptoras aceptan documentos recientes, por lo que recomendamos usarla dentro de los 30 a 60 días posteriores a su expedición, salvo que la entidad indique algo distinto."},{q:"¿Puedo solicitar si soy independiente?",a:"Sí. La certificación aplica para trabajadores independientes, contratistas, freelancers, comerciantes, rentistas y otras personas naturales con ingresos demostrables. Lo importante es contar con soportes suficientes y coherentes con el monto que se certificará."},{q:"¿Qué pasa si mis soportes están incompletos?",a:"Podemos orientarle sobre qué documentos faltan y qué alternativas existen para complementar la solicitud. No siempre se requiere detener el proceso de inmediato, pero sí es necesario completar los soportes antes de emitir una certificación responsable y sustentada."},{q:"¿Cómo sé si debo declarar renta?",a:"En la sección de herramientas puede revisar los topes principales de forma orientativa. Sin embargo, la obligación real depende también de su condición tributaria, de la naturaleza de sus ingresos y de otros criterios normativos, por lo que una revisión profesional siempre es recomendable."},{q:"¿Qué documentos necesito para declarar renta?",a:"Usualmente se revisan certificados laborales, extractos bancarios, certificados de inversiones, deudas, bienes, aportes, pagos a salud y pensión, soportes de deducciones y cualquier documento que afecte su patrimonio o su renta. Tenerlos organizados reduce errores y agiliza el proceso."},{q:"¿Qué pasa si no declaro a tiempo?",a:"Puede generarse sanción por extemporaneidad y, según el caso, intereses o sanciones mínimas. Además del costo económico, presentar tarde suele traer más presión operativa y riesgo de omisiones, por lo que conviene programar la declaración con anticipación."},{q:"¿Puedo corregir mi declaración?",a:"Sí, en muchos casos es posible corregirla dentro de los términos legales. La conveniencia y el costo de la corrección dependen del tipo de error, del momento en que se detecta y del efecto sobre el impuesto a cargo o el saldo declarado."},{q:"¿Cómo funciona el plan mensual?",a:"Primero revisamos el tamaño y necesidad de su negocio, y luego proponemos un plan acorde al volumen de operaciones y obligaciones. El objetivo es acompañarlo de forma permanente para que su contabilidad y sus impuestos no dependan de acciones improvisadas."},{q:"¿Puedo contratar un servicio puntual?",a:"Sí. Puede contratar certificaciones, declaraciones, matrícula mercantil, facturación electrónica, información exógena u otros apoyos específicos sin necesidad de tomar un plan mensual. Así recibe exactamente el servicio que necesita en ese momento."},{q:"¿Qué incluye el outsourcing contable?",a:"Incluye registro contable, conciliaciones, revisión de soportes, estados financieros, orientación en impuestos y acompañamiento sobre cumplimiento. El alcance final puede variar según el plan y el tipo de empresa, pero siempre busca dar control y claridad sobre la información financiera."},{q:"¿Cuánto tarda renovar matrícula?",a:"Con información completa, el trámite puede resolverse en un plazo corto, pero el tiempo exacto depende de la entidad y del estado documental. Lo recomendable es no esperar al último momento, porque los vencimientos suelen concentrar más solicitudes."},{q:"¿Qué necesito para crear empresa?",a:"Se requiere definir el tipo societario, revisar el nombre, preparar los datos de socios o accionistas, actividad económica, capital y demás elementos básicos para formalizar el negocio ante Cámara de Comercio y DIAN. Una buena planeación evita reprocesos posteriores."},{q:"¿Me ayudan con facturación electrónica?",a:"Sí. Podemos acompañarle en habilitación, numeración, revisión del proveedor tecnológico y aspectos operativos para que su proceso de facturación sea consistente con la normatividad y con su operación contable."},{q:"¿Qué medios de pago aceptan?",a:"Aceptamos medios digitales como Wompi, incluyendo opciones como tarjeta, PSE y otros canales habilitados. También podemos informarle las alternativas disponibles al momento de contratar un servicio específico."},{q:"¿Cómo envío mis documentos?",a:"Puede enviarlos por el formulario cuando aplique o por WhatsApp, según el tipo de servicio. Siempre es importante que los archivos sean legibles, completos y correspondan exactamente a la información que se desea certificar o liquidar."},{q:"¿Mis datos están seguros?",a:"Sí. La información se trata bajo criterios de confidencialidad y protección de datos. Además, procuramos que cada trámite use solo la información necesaria y que el cliente tenga claridad sobre su uso y finalidad."},{q:"¿Qué es la información exógena?",a:"Es un reporte de operaciones con terceros y otros datos tributarios que ciertas personas o empresas deben presentar ante la DIAN. Su preparación exige depurar bases y revisar coherencia con declaraciones, retenciones y soportes contables para evitar inconsistencias."}];
function FaqS(){const[o,sO]=useState(null);return(<Sec id="faq" title="Preguntas frecuentes" sub="DUDAS" bg={B[4]} narrow><div style={{display:"grid",gap:9}}>{FQ.map((f,i)=><Cd key={i} s={{borderRadius:11,background:"#fff",overflow:"hidden",cursor:"pointer",padding:0}} onClick={()=>sO(o===i?null:i)}><div style={{padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:15,fontWeight:600,color:"#0B1D3A",fontFamily:F,flex:1}}>{f.q}</span><span style={{fontSize:17,color:"#2563EB",transform:o===i?"rotate(45deg)":"rotate(0)",transition:"transform .3s",marginLeft:10}}>+</span></div>{o===i&&<div style={{padding:"0 20px 14px",fontSize:14,color:"#5A6F8A",lineHeight:1.8,fontFamily:F}}>{f.a}</div>}</Cd>)}</div></Sec>)}

/* ══════ PRIVACY ══════ */
const PV=[{t:"1. Responsable",c:`CONTARAE. Bogotá D.C. ${EM}. +57 301 310 1050.`},{t:"2. Marco",c:"Constitución (art. 15), Ley 1581/2012, Decreto 1074/2015."},{t:"3. Definiciones",c:"Dato personal, sensible, titular, responsable, encargado, tratamiento, autorización (art. 3)."},{t:"4. Principios",c:"Legalidad, finalidad, libertad, veracidad, transparencia, acceso restringido, seguridad, confidencialidad."},{t:"5. Datos",c:"Identificación, contacto, financieros/tributarios, laborales."},{t:"6. Finalidades",c:"Servicios contables, certificaciones, DIAN, nómina, comunicación, facturación, consultas."},{t:"7. Derechos",c:"Conocer, actualizar, rectificar, prueba de autorización, quejas SIC, revocar, acceso gratuito (art. 8)."},{t:"8. Autorización",c:"Previa, expresa e informada. Conservada conforme art. 9."},{t:"9. Sensibles",c:"No se recopilan sistemáticamente (arts. 5 y 6)."},{t:"10. Menores",c:"No se tratan salvo representante legal (art. 7)."},{t:"11. Deberes",c:"Habeas data, conservar autorización, informar, veracidad, seguridad (art. 17)."},{t:"12. Seguridad",c:"Técnicas, humanas y administrativas."},{t:"13. Transferencia",c:"Solo legal o autorización expresa. Internacional art. 26."},{t:"14. Consultas",c:`10 días hábiles (prorrogable 5). Reclamos 15 (prorrogable 8). ${EM}.`},{t:"15. Canales",c:`${EM}. +57 301 310 1050. Bogotá. Lun-Vie 8am-6pm.`},{t:"16. Vigencia",c:"Desde publicación. Modificaciones en el sitio web."},{t:"17. Autoridad",c:"SIC. www.sic.gov.co. 01 8000 910 165."}];
function Prv(){const[s,sS]=useState(false);return(<div style={{maxWidth:900,margin:"0 auto",padding:"0 24px"}}><div style={{textAlign:"center",marginBottom:16}}><button onClick={()=>sS(!s)} style={{background:"none",border:"none",color:"rgba(255,255,255,.7)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F,textDecoration:"underline"}}>{s?"Ocultar":"Consultar"} Política de Datos</button></div>{s&&<div style={{padding:24,borderRadius:13,background:"rgba(255,255,255,.05)",border:"1px solid rgba(96,165,250,.1)",marginBottom:18}}><h3 style={{fontFamily:FH,fontSize:17,fontWeight:700,color:"#fff",marginBottom:16,textAlign:"center"}}>Política de Tratamiento de Datos Personales</h3>{PV.map((p,i)=><div key={i} style={{marginBottom:12}}><h4 style={{fontSize:13,fontWeight:700,color:"#60A5FA",marginBottom:3,fontFamily:F}}>{p.t}</h4><p style={{fontSize:13,color:"rgba(255,255,255,.6)",lineHeight:1.8,fontFamily:F}}>{p.c}</p></div>)}</div>}</div>)}

/* ══════ FOOTER ══════ */
function Ftr(){return(<><section id="contacto" style={{padding:"88px 24px",background:B[7]}}><div style={{maxWidth:700,margin:"0 auto",textAlign:"center",padding:"56px 36px",borderRadius:24,background:"linear-gradient(135deg,#0B1D3A,#17345D 55%,#1B3A5C)",position:"relative",overflow:"hidden",boxShadow:"0 24px 60px rgba(15,23,42,.18)",border:"1px solid rgba(125,211,252,.12)"}}><div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 20% 20%, rgba(56,189,248,.12), transparent 32%), radial-gradient(circle at 80% 22%, rgba(59,130,246,.10), transparent 28%)"}}/><h2 style={{position:"relative",fontFamily:FH,fontSize:"clamp(23px,3.7vw,34px)",fontWeight:700,color:"#fff",marginBottom:14}}>¿Listo para ordenar sus finanzas?</h2><p style={{position:"relative",fontSize:15,color:"rgba(255,255,255,.70)",margin:"0 auto 28px",fontFamily:F,maxWidth:520,lineHeight:1.8}}>Contadores Públicos certificados en Bogotá a su servicio, con una experiencia clara, cercana y profesional en cada paso.</p><div style={{position:"relative",display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}><a href={wm("Hola CONTARAE, quiero recibir asesoría contable.")} target="_blank" rel="noopener noreferrer" style={{padding:"13px 28px",borderRadius:14,background:"#25D366",color:"#fff",fontSize:15,fontWeight:700,textDecoration:"none",fontFamily:F,boxShadow:"0 12px 24px rgba(37,211,102,.18)"}}>WhatsApp</a><a href={`mailto:${EM}`} style={{padding:"13px 28px",borderRadius:14,background:"rgba(255,255,255,.1)",color:"#fff",fontSize:15,fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,255,255,.16)",fontFamily:F,backdropFilter:"blur(8px)"}}>Correo</a></div></div></section>
<footer style={{padding:"44px 24px 32px",background:"#080E1B"}}><LogoFt/><div style={{maxWidth:620,margin:"0 auto",textAlign:"center"}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:20}}><div style={{fontSize:14,color:"rgba(255,255,255,.6)",fontFamily:F}}>📱 <strong style={{color:"#fff"}}>WhatsApp:</strong> +57 301 310 1050</div><div style={{fontSize:14,color:"rgba(255,255,255,.6)",fontFamily:F}}>✉️ <strong style={{color:"#fff"}}>Correo:</strong> {EM}</div><div style={{fontSize:14,color:"rgba(255,255,255,.6)",fontFamily:F}}>📍 <strong style={{color:"#fff"}}>Ubicación:</strong> Bogotá D.C.</div><div style={{fontSize:14,color:"rgba(255,255,255,.6)",fontFamily:F}}>🕐 <strong style={{color:"#fff"}}>Horario:</strong> Lun-Vie 8am-6pm</div></div><Prv/><div style={{display:"flex",justifyContent:"center",marginBottom:14}}><a href={ADMIN_ROUTE} style={{fontSize:12,color:"rgba(255,255,255,.45)",fontFamily:F,textDecoration:"none",padding:"9px 14px",borderRadius:999,border:"1px solid rgba(96,165,250,.14)",background:"rgba(255,255,255,.03)",transition:"all .2s ease"}} onMouseEnter={e=>{e.currentTarget.style.color="#BFDBFE";e.currentTarget.style.borderColor="rgba(96,165,250,.3)";e.currentTarget.style.background="rgba(37,99,235,.09)";}} onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.45)";e.currentTarget.style.borderColor="rgba(96,165,250,.14)";e.currentTarget.style.background="rgba(255,255,255,.03)";}}>Panel de funcionarios</a></div><div style={{borderTop:"1px solid rgba(96,165,250,.1)",paddingTop:18,marginTop:12}}><p style={{fontSize:11,color:"rgba(255,255,255,.35)",fontFamily:F}}>© 2026 CONTARAE · Bogotá D.C., Colombia · Todos los derechos reservados</p><p style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:4,fontFamily:F}}>Ley 1581 de 2012 — Protección de Datos Personales</p></div></div></footer></>)}

/* ══════ FLOATS ══════ */
function Flt(){const[s,sS]=useState(false);useEffect(()=>{const h=()=>sS(window.scrollY>400);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);
return(<><a href={wm("Hola CONTARAE, me gustaría recibir asesoría.")} target="_blank" rel="noopener noreferrer" style={{position:"fixed",bottom:28,right:28,zIndex:1000,width:52,height:52,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(37,211,102,.4)",textDecoration:"none",fontSize:24,opacity:.85,transition:"opacity .2s"}} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity=".85"} aria-label="WhatsApp">💬</a>
{s&&<button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} style={{position:"fixed",bottom:88,right:32,zIndex:1000,width:40,height:40,borderRadius:"50%",background:"rgba(11,29,58,.8)",border:"1px solid rgba(96,165,250,.25)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#60A5FA",boxShadow:"0 3px 12px rgba(0,0,0,.15)",fontSize:16,fontWeight:700,opacity:.85,transition:"opacity .2s"}} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity=".85"} aria-label="Subir">⇧</button>}</>)}

/* ══════ APP ══════ */
export default function App(){
  const[path,sPath]=useState(getCurrentPath());
  const certRoute=isCertificationPath(path);
  const adminRoute=isAdminPath(path);

  useEffect(()=>{const sync=()=>sPath(getCurrentPath());window.addEventListener("popstate",sync);window.addEventListener("hashchange",sync);return()=>{window.removeEventListener("popstate",sync);window.removeEventListener("hashchange",sync);};},[]);
  useEffect(()=>{if(adminRoute)return undefined;const obs=new IntersectionObserver(en=>{en.forEach(e=>{if(e.isIntersecting){e.target.style.opacity="1";e.target.style.transform="translateY(0)";}});},{threshold:.06});setTimeout(()=>{document.querySelectorAll(".ai").forEach(el=>{el.style.opacity="0";el.style.transform="translateY(18px)";el.style.transition="opacity .72s ease,transform .72s cubic-bezier(.22,1,.36,1)";obs.observe(el);});},100);return()=>obs.disconnect();},[path,adminRoute]);
  useEffect(()=>{if(adminRoute)return undefined;const go=e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const href=a.getAttribute("href");if(!href||href==="#")return;const id=href.slice(1);if(!scrollToId(id))return;e.preventDefault();if(window.history?.replaceState)window.history.replaceState(null,"",`${window.location.pathname}${window.location.search}#${id}`);};document.addEventListener("click",go);return()=>document.removeEventListener("click",go);},[adminRoute]);
  useEffect(()=>{if(adminRoute)return undefined;const id=window.location.hash?.slice(1);if(!id)return undefined;const timer=window.setTimeout(()=>{scrollToId(id,"auto");},120);return()=>window.clearTimeout(timer);},[path,adminRoute]);
  useEffect(()=>{document.title=adminRoute?"Panel interno | CONTARAE":certRoute?"Certificación de ingresos | CONTARAE":"CONTARAE | Servicios contables, tributarios y financieros";const meta=document.querySelector('meta[name=\"description\"]');if(meta)meta.setAttribute("content",adminRoute?"Panel interno de revision de certificaciones de CONTARAE.":certRoute?"Solicite su certificación de ingresos firmada por Contador Público en Colombia. Pago en línea, seguimiento de referencia y atención por WhatsApp o correo.":"Certificación de ingresos por Contador Público. Servicios contables, tributarios y financieros para personas, emprendedores y pymes en Colombia.");},[certRoute,adminRoute]);

  return(<div style={{fontFamily:F,color:"#0B1D3A",background:"#f8fafd",minHeight:"100vh"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box;}html{scroll-behavior:smooth;scroll-padding-top:156px;}body{background:#f6fafe;color:#0B1D3A;}::selection{background:#2563EB;color:#fff;}a{color:inherit;}h1,h2,h3,h4{letter-spacing:-.02em;}p{font-family:${F};}section{position:relative;}@keyframes cardGlowFlow{0%{background-position:0% 50%}100%{background-position:220% 50%}} .card-glow-shell:hover .card-glow-ring{opacity:1!important;} @media(max-width:1024px){.tool-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}}@media(max-width:768px){.dk{display:none!important;}.hm{display:block!important;}.tool-grid{grid-template-columns:1fr!important;}section{padding-left:18px!important;padding-right:18px!important;}}`}</style>
    {adminRoute?<AdminPanel/>:<>
    <script src="https://checkout.wompi.co/widget.js" async></script>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"ProfessionalService","name":"CONTARAE","description":"Certificación de ingresos por Contador Público. Servicios contables, tributarios y financieros para microempresas, emprendedores y pymes en Colombia.","url":"https://contarae.com","telephone":"+573013101050","email":"info@contarae.com","address":{"@type":"PostalAddress","addressLocality":"Bogotá","addressCountry":"CO"},"areaServed":"CO","priceRange":"$$","openingHours":"Mo-Fr 08:00-18:00"})}}/>
    <Nav path={path}/><Banner path={path}/>
    <form name="certificacion" data-netlify="true" hidden><input name="form-name" type="hidden" value="certificacion"/><input name="consecutivo"/><input name="nombre"/><input name="tipo_documento"/><input name="numero_documento"/><input name="lugar_expedicion"/><input name="telefono"/><input name="correo"/><input name="email"/><input name="destino"/><input name="entidad"/><input name="periodo"/><input name="ingresos_laborales"/><input name="pensiones"/><input name="dividendos"/><input name="inversiones"/><input name="arriendos"/><input name="remesas"/><input name="otros_ingresos"/><input name="otros_descripcion"/><input name="total_ingresos"/><input name="tarifa_pagada"/><input name="soportes_adjuntos"/><input name="referencia_wompi"/><input name="estado_pago"/><input name="comentarios"/><input name="declaracion_juramentada"/></form>
    {certRoute?<>
      <CertificationHero/>
      <div className="ai"><CrtS/></div>
      <div className="ai"><FaqS/></div>
      <div className="ai"><Ftr/></div>
    </>:<>
      <Hero/>
      <div className="ai"><SvcS/></div>
      <div className="ai"><PlnS/></div>
      <div className="ai"><ScnS/></div>
      <div className="ai"><TrmS/></div>
      <div className="ai"><CrtS/></div>
      <div className="ai"><Tools/></div>
      <div className="ai"><TlS/></div>
      <div className="ai"><BlgS/></div>
      <div className="ai"><DwS/></div>
      <div className="ai"><FaqS/></div>
      <div className="ai"><AltS/></div>
      <div className="ai"><WhyUs/></div>
      <div className="ai"><Abt/></div>
      <div className="ai"><Ftr/></div>
    </>}
    <Flt/>
    </>}
  </div>);
}
