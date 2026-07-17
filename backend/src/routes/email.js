// src/routes/email.js
const router = require('express').Router();
const pool   = require('../db/pool');
const { requirePlatformAdmin } = require('../middleware/auth');

// Settings
router.get('/settings', requirePlatformAdmin, async (req,res)=>{
  try{const{rows}=await pool.query('SELECT * FROM email_settings LIMIT 1');res.json(rows[0]||{});}
  catch(e){res.status(500).json({error:e.message})}});

router.put('/settings', requirePlatformAdmin, async (req,res)=>{
  const s=req.body;
  try{const{rows}=await pool.query(
    `INSERT INTO email_settings (support_mailbox,sla_hours,spam_threshold,spam_action,auto_reply,auto_reply_text)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT DO UPDATE SET
       support_mailbox=$1,sla_hours=$2,spam_threshold=$3,spam_action=$4,auto_reply=$5,auto_reply_text=$6,updated_at=NOW()
     RETURNING *`,
    [s.supportMailbox||s.support_mailbox,s.slaHours||s.sla_hours||24,
     s.spamThreshold||s.spam_threshold||5,s.spamAction||s.spam_action||'junk',
     s.autoReply!==undefined?s.autoReply:(s.auto_reply!==false),
     s.autoReplyText||s.auto_reply_text||'']);
  res.json(rows[0]);}
  catch(e){res.status(500).json({error:e.message})}});

// Rules
router.get('/rules', requirePlatformAdmin, async (req,res)=>{
  try{const{rows}=await pool.query('SELECT * FROM email_rules ORDER BY created_at');res.json(rows);}
  catch(e){res.status(500).json({error:e.message})}});

router.post('/rules', requirePlatformAdmin, async (req,res)=>{
  const r=req.body;
  try{const{rows}=await pool.query(
    `INSERT INTO email_rules (id,name,condition,condition_value,action,action_value,enabled,hits)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET enabled=EXCLUDED.enabled,hits=EXCLUDED.hits RETURNING *`,
    [r.id||`R${Date.now().toString(36)}`,r.name,r.condition,r.conditionValue||r.condition_value,
     r.action,r.actionValue||r.action_value,r.enabled!==false,r.hits||0]);
  res.json(rows[0]);}
  catch(e){res.status(500).json({error:e.message})}});

router.put('/rules/:id/hit', requirePlatformAdmin, async (req,res)=>{
  try{await pool.query('UPDATE email_rules SET hits=hits+1 WHERE id=$1',[req.params.id]);res.json({success:true});}
  catch(e){res.status(500).json({error:e.message})}});

router.delete('/rules/:id', requirePlatformAdmin, async(req,res)=>{
  try{await pool.query('DELETE FROM email_rules WHERE id=$1',[req.params.id]);res.json({success:true});}
  catch(e){res.status(500).json({error:e.message})}});

module.exports = router;
