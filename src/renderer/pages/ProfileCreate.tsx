// StealthNode — Profile Creation Wizard
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/appStore'
import { AVATAR_EMOJIS, AVATAR_GRADIENTS, SECURITY_QUESTIONS } from '../../shared/constants'

const STEPS = ['Avatar', 'Name', 'Password', 'Security', 'Review']

export default function ProfileCreate() {
  const { setView, addToast, theme } = useAppStore()
  const [step, setStep] = useState(0)
  const [avatarType, setAvatarType] = useState<'emoji'|'initials'>('emoji')
  const [avatarEmoji, setAvatarEmoji] = useState('🦊')
  const [avatarInitials, setAvatarInitials] = useState('')
  const [gradientIdx, setGradientIdx] = useState(0)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [sq, setSQ] = useState([
    { question: SECURITY_QUESTIONS[0], answer: '' },
    { question: SECURITY_QUESTIONS[1], answer: '' },
    { question: SECURITY_QUESTIONS[2], answer: '' }
  ])
  const [creating, setCreating] = useState(false)
  const gradient = AVATAR_GRADIENTS[gradientIdx]

  function getStrength(pw: string) {
    if (!pw) return { label: '', color: '#333', width: '0%' }
    const s = (pw.length>=8?1:0)+(pw.length>=12?1:0)+(/[A-Z]/.test(pw)&&/[a-z]/.test(pw)?1:0)+(/\d/.test(pw)?1:0)+(/[^A-Za-z0-9]/.test(pw)?1:0)
    if(s<=1) return{label:'Very Weak',color:'#EF4444',width:'20%'}
    if(s===2) return{label:'Weak',color:'#F97316',width:'40%'}
    if(s===3) return{label:'Fair',color:'#F59E0B',width:'60%'}
    if(s===4) return{label:'Strong',color:'#10B981',width:'80%'}
    return{label:'Very Strong',color:'#059669',width:'100%'}
  }
  const strength = getStrength(password)
  const canNext = [()=>true,()=>name.trim().length>=2,()=>password.length>=8&&password===confirmPw&&['Strong','Very Strong'].includes(strength.label),()=>sq.every(q=>q.answer.trim().length>0),()=>true]

  async function handleCreate() {
    setCreating(true)
    try {
      await window.stealthNode.createProfile({
        name:name.trim(), avatarType, avatarEmoji, avatarInitials:avatarInitials.trim(),
        avatarGradientFrom:gradient.from, avatarGradientTo:gradient.to, password,
        securityQuestions: sq.map(q=>({question:q.question,answer:q.answer.trim()}))
      })
      addToast({type:'success',title:'Profile created!',message:`Welcome, ${name}!`})
      setView('profiles')
    } catch(e:any) { addToast({type:'error',title:'Failed',message:e.message}) }
    setCreating(false)
  }

  const inputStyle: React.CSSProperties = { width:'100%', padding:'14px 18px', borderRadius:14, fontSize:15,
    background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text-primary)', outline:'none' }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{background:'var(--bg-primary)'}}>
      <button onClick={()=>step>0?setStep(step-1):setView('profiles')} style={{position:'absolute',top:16,left:20,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'6px 14px',color:'var(--text-secondary)',cursor:'pointer',fontSize:13}}>
        ← {step>0?'Back':'Cancel'}
      </button>

      {/* Progress dots */}
      <div className="flex items-center gap-3 mb-8">
        {STEPS.map((s,i)=>(
          <React.Fragment key={s}>
            <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,background:i<=step?theme.accent:'var(--surface)',color:i<=step?'#fff':'var(--text-muted)',transition:'all 0.3s'}}>{i+1}</div>
            {i<STEPS.length-1&&<div style={{width:24,height:2,background:i<step?theme.accent:'var(--border)',borderRadius:1}}/>}
          </React.Fragment>
        ))}
      </div>

      <div style={{width:420,minHeight:280}}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{x:40,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-40,opacity:0}} transition={{duration:0.25}}>
            {step===0&&(<div className="flex flex-col items-center gap-5">
              <h2 style={{fontSize:22,fontWeight:700}}>Choose Your Avatar</h2>
              <div style={{width:80,height:80,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,background:`linear-gradient(135deg,${gradient.from},${gradient.to})`}}>
                {avatarType==='emoji'?avatarEmoji:<span style={{fontSize:28,fontWeight:700,color:'#fff'}}>{avatarInitials||'?'}</span>}
              </div>
              <div className="flex gap-2 flex-wrap justify-center" style={{maxWidth:360}}>
                {AVATAR_EMOJIS.map(e=>(<button key={e} onClick={()=>{setAvatarType('emoji');setAvatarEmoji(e)}} style={{width:44,height:44,borderRadius:12,fontSize:22,border:avatarEmoji===e&&avatarType==='emoji'?`2px solid ${theme.accent}`:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{e}</button>))}
              </div>
              <div className="flex gap-2 flex-wrap justify-center" style={{maxWidth:360}}>
                {AVATAR_GRADIENTS.map((g,i)=>(<button key={i} onClick={()=>setGradientIdx(i)} style={{width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${g.from},${g.to})`,border:i===gradientIdx?'3px solid var(--text-primary)':'2px solid transparent',cursor:'pointer'}}/>))}
              </div>
            </div>)}

            {step===1&&(<div className="flex flex-col items-center gap-6">
              <h2 style={{fontSize:22,fontWeight:700}}>Profile Name</h2>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name" autoFocus maxLength={30} style={inputStyle}/>
            </div>)}

            {step===2&&(<div className="flex flex-col gap-4">
              <h2 style={{fontSize:22,fontWeight:700,textAlign:'center'}}>Master Password</h2>
              <div style={{position:'relative'}}>
                <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create master password" autoFocus style={{...inputStyle,paddingRight:50}}/>
                <button onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:18}}>{showPw?'🙈':'👁️'}</button>
              </div>
              {password&&<div><div style={{height:4,borderRadius:2,background:'var(--bg-tertiary)',overflow:'hidden'}}><motion.div animate={{width:strength.width}} style={{height:'100%',background:strength.color,borderRadius:2}} transition={{duration:0.3}}/></div><span style={{fontSize:12,color:strength.color,fontWeight:600,marginTop:4,display:'block'}}>{strength.label}</span></div>}
              <input type={showPw?'text':'password'} value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="Confirm password" style={{...inputStyle,borderColor:confirmPw?(password===confirmPw?'var(--success)':'var(--danger)'):'var(--border)'}}/>
              {confirmPw&&<span style={{fontSize:12,color:password===confirmPw?'var(--success)':'var(--danger)'}}>{password===confirmPw?'✅ Match':'❌ No match'}</span>}
            </div>)}

            {step===3&&(<div className="flex flex-col gap-4">
              <h2 style={{fontSize:22,fontWeight:700,textAlign:'center'}}>Security Questions</h2>
              {sq.map((q,i)=>(<div key={i} className="flex flex-col gap-2">
                <select value={q.question} onChange={e=>{const n=[...sq];n[i].question=e.target.value;setSQ(n)}} style={{...inputStyle,padding:'10px 14px',fontSize:13}}>{SECURITY_QUESTIONS.map(s=><option key={s} value={s}>{s}</option>)}</select>
                <input value={q.answer} onChange={e=>{const n=[...sq];n[i].answer=e.target.value;setSQ(n)}} placeholder="Your answer" style={{...inputStyle,padding:'10px 14px',fontSize:13}}/>
              </div>))}
            </div>)}

            {step===4&&(<div className="flex flex-col items-center gap-4">
              <h2 style={{fontSize:22,fontWeight:700}}>Review & Confirm</h2>
              <div style={{width:70,height:70,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,background:`linear-gradient(135deg,${gradient.from},${gradient.to})`}}>
                {avatarType==='emoji'?avatarEmoji:<span style={{fontSize:24,fontWeight:700,color:'#fff'}}>{avatarInitials}</span>}
              </div>
              <div style={{fontWeight:600,fontSize:18}}>{name}</div>
              <div style={{color:'var(--text-muted)',fontSize:13}}>Strength: <span style={{color:strength.color}}>{strength.label}</span></div>
              <div style={{color:'var(--text-muted)',fontSize:13}}>3 security questions set</div>
            </div>)}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} disabled={!canNext[step]()||creating}
        onClick={()=>step<4?setStep(step+1):handleCreate()}
        style={{marginTop:32,padding:'12px 40px',borderRadius:14,fontSize:15,fontWeight:600,background:canNext[step]()?theme.accent:'var(--surface)',color:canNext[step]()?'#fff':'var(--text-muted)',border:'none',cursor:canNext[step]()?'pointer':'not-allowed',opacity:creating?0.7:1}}>
        {creating?'Creating...':step<4?'Continue':'Create Profile'}
      </motion.button>
    </div>
  )
}
