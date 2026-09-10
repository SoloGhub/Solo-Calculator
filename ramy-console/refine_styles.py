from pathlib import Path
p=Path(__file__).parent
s=(p/'styles.css').read_text()
s=s.replace("font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif","font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif")
s=s.replace('font:500 clamp(25px,3.2vw,38px)/1.18 Georgia,serif;letter-spacing:-.8px','font-size:clamp(25px,3.2vw,34px);font-weight:600;line-height:1.2;letter-spacing:-.6px')
s=s.replace('font:italic 19px Georgia,serif;','font-size:15px;font-weight:650;letter-spacing:2px;')
s=s.replace('font:italic 24px Georgia,serif;','font-size:20px;font-weight:600;')
s=s.replace('width:52px;height:52px;object-fit:contain;background:#fff;border-radius:12px;border:1px solid var(--line)','width:55px;height:86px;object-fit:contain;background:transparent;border-radius:0;border:0;flex:none')
s=s.replace('.logo{width:46px;height:46px}', '.logo{width:47px;height:73px}')
s=s.replace('text-transform:uppercase;letter-spacing:1.8px;font-size:10px','text-transform:none;letter-spacing:.2px;font-size:12px')
s=s.replace('h2{font-size:20px','h2{font-size:18px')
s=s.replace('font-weight:750','font-weight:650')
s=s.replace('.step{color:var(--gold);font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:650;margin-bottom:7px}','')
s=s.replace('--bg:#f4eee4;--paper:#fffaf2;--wash:#efe3ce;','--bg:#f2ebe0;--paper:#fffcf7;--wash:#e9dbc4;')
s=s.replace('--line:#d9c9aa;','--line:#d9c9af;')
s=s.replace('body{margin:0;background:radial-gradient(ellipse at 90% 0%,var(--wash),transparent 55%),linear-gradient(130deg,var(--bg),var(--paper));','body{margin:0;background:radial-gradient(ellipse at 95% 0%,var(--wash),transparent 45%),radial-gradient(ellipse at 0% 80%,#802b4008,transparent 65%),linear-gradient(130deg,var(--bg),var(--paper));')
s=s.replace('font-size:38px','font-size:34px').replace('font-size:32px','font-size:30px')
s=s.replace('.app-title strong{display:block;font-size:15px;letter-spacing:.1px}', '.app-title strong{display:block;font-size:18px;letter-spacing:-.3px;font-weight:600}')
s=s.replace('.app-title strong{font-size:14px}', '.app-title strong{font-size:16px}')
s=s.replace('.intro h1{font-size:29px}', '.intro h1{font-size:26px}')
s=s.replace('font-size:12px;font-weight:700;display:block;margin-bottom:7px', 'font-size:13px;font-weight:600;display:block;margin-bottom:8px')
s=s.replace('font-size:13px;font-weight:700;text-decoration:none','font-size:13px;font-weight:600;text-decoration:none')
s=s.replace('h1,h2,h3,p{margin-top:0}', 'h1,h2,h3,p{margin-top:0}h2,h3{font-weight:600;letter-spacing:-.2px}')
s=s.replace('.report-content .panel{padding:13px;margin-bottom:13px;box-shadow:none;border-radius:12px;break-inside:avoid-page}', '.report-content .panel{padding:13px;margin-bottom:13px;box-shadow:none;border-radius:12px;break-inside:auto}.report-content .panel:first-child{break-inside:avoid-page}')
s+='''
/* RAMY editorial and visual revision: no numbered screens or mixed heading fonts. */
.top{border-bottom:1px solid var(--gold);box-shadow:0 2px 16px #14273b08}
.top-inner{gap:15px}
.views-toggle{border:1px solid var(--line);background:var(--paper);border-radius:12px;min-height:44px;padding:8px 11px;font-size:12px;font-weight:600;flex:none}
.views-toggle[aria-expanded=true]{background:var(--wash);border-color:var(--gold)}
.intro{position:relative;padding:21px 24px;min-height:125px;border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:19px;background:radial-gradient(ellipse at right bottom,#a27b3710,transparent 65%),linear-gradient(115deg,var(--paper),var(--wash));overflow:hidden;isolation:isolate}
.intro::before{content:'';position:absolute;width:190px;height:190px;border:1px solid #a27b3725;right:-50px;top:-70px;border-radius:50%;z-index:-1;box-shadow:0 0 0 16px #a27b3705,0 0 0 33px #a27b3704}
.intro-copy{min-width:0;max-width:calc(100% - 110px)}
.intro p{max-width:550px;font-size:13px;line-height:1.55}
.intro .badge{margin-top:10px;font-size:11px;font-weight:500;background:var(--paper)}
.section-art{width:96px;height:96px;object-fit:contain;flex:none;mix-blend-mode:multiply;display:block;border:0}
.panel{border-top:2px solid color-mix(in srgb,var(--gold) 55%,var(--line));box-shadow:0 10px 28px #14273b07,inset 0 1px 0 #ffffffcc}
.panel-head{border-bottom-color:color-mix(in srgb,var(--line) 75%,transparent)}
.field input,.field select,.field textarea{box-shadow:inset 0 1px 3px #14273b05;background:color-mix(in srgb,var(--paper) 92%,white);border-color:color-mix(in srgb,var(--line) 85%,var(--muted));font-weight:400}
.field small{font-size:11px}
.btn.primary{box-shadow:0 4px 10px #14273b16}
.mode[aria-pressed=true]{box-shadow:0 3px 9px #802b4025}
.nav-btn[aria-current=page]{box-shadow:inset 0 2px 0 var(--ruby)}
.kpi:first-child{background:linear-gradient(135deg,#213e55,#132c42);color:#fff8e9;border-color:#263f54}
.kpi:first-child small,.kpi:first-child .sub{color:#e4d7be}
.kpi:nth-child(3n){border-top:2px solid var(--ruby)}
.kpi strong{font-weight:600;letter-spacing:-.3px}
.kpi small{font-weight:500}
.welcome{max-width:920px;margin:10px auto}
.welcome-heading{display:flex;justify-content:space-between;align-items:center;gap:18px}
.welcome-heading h1{font-weight:600}
.welcome-heading p{color:var(--muted);font-size:14px;margin:0}
.welcome-heading .section-art{width:135px;height:120px}
.workspace-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:25px}
.workspace-tile{display:flex;align-items:center;gap:15px;min-width:0;text-align:left;padding:18px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(120deg,var(--paper),var(--wash));box-shadow:0 4px 12px #14273b05}
.workspace-tile .section-art{width:74px;height:80px}
.workspace-tile>span{display:block;min-width:0;flex:1}
.workspace-tile strong{display:block;font-size:15px;font-weight:600;line-height:1.35}
.workspace-tile small{display:block;font-size:11px;margin-top:4px}
.workspace-tile>svg{width:16px;height:16px;color:var(--gold)}
.report-brand{margin-bottom:20px}
.report-brand .logo{width:58px;height:90px}
.report-brand h1{font-size:27px;font-weight:600}
.report-meta-grid b{font-weight:550}
.signature b{font-family:inherit;font-style:normal}
@media(max-width:650px){
 .top-inner{gap:9px}.top{padding-top:calc(8px + env(safe-area-inset-top,0px));padding-bottom:8px}
 .content{padding-top:15px}.context-name{font-size:12px}.save-state{font-size:10px}
 .intro{padding:17px;min-height:112px}.intro-copy{max-width:calc(100% - 82px)}.intro .section-art{width:75px;height:86px}
 .intro h1{font-size:25px}.intro p{font-size:12px}.panel-head h2{font-size:17px}
 .welcome-heading .section-art{width:90px;height:90px}.welcome-heading h1{font-size:27px}
 .welcome-heading p{font-size:13px}.workspace-grid{gap:9px;margin-top:20px}
 .workspace-tile{flex-direction:column;align-items:flex-start;gap:8px;padding:14px;min-height:154px}
 .workspace-tile .section-art{width:65px;height:62px;align-self:center}.workspace-tile strong{font-size:13px}
 .workspace-tile small{font-size:11px}.workspace-tile>svg{display:none}.workspace-tile>span{flex:0}
 .report-brand h1{font-size:23px}.report-brand .logo{width:47px;height:73px}
 .views-toggle{padding:8px;font-size:11px}.eyebrow{font-size:11px}
}
@media print{.section-art{display:none}.logo{background:transparent!important;border:0!important}.report-brand .logo{width:48px;height:75px}.report-brand h1{font-size:25px}.report-table td{font-size:10px}.views-toggle{display:none}}
'''
(p/'styles.css').write_text(s)
