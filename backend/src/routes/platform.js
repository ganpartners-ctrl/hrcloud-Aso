// src/routes/platform.js
const router  = require('express').Router();
const pool    = require('../db/pool');
const bcrypt  = require('bcryptjs');
const { requirePlatformAdmin } = require('../middleware/auth');

// Staff
router.get('/staff', requirePlatformAdmin, async(req,res)=>{
  try{const{rows}=await pool.query('SELECT id,name,email,role,permissions,is_active,created_at FROM platform_staff ORDER BY name');res.json(rows);}
  catch(e){res.status(500).json({error:e.message})}});

router.post('/staff', requirePlatformAdmin, async(req,res)=>{
  const s=req.body;
  try{
    const hash = s.password ? await bcrypt.hash(s.password, 10) : null;
    const{rows}=await pool.query(
      `INSERT INTO platform_staff(id,name,email,role,password_hash,permissions,is_active)
       VALUES($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email,role=EXCLUDED.role,is_active=EXCLUDED.is_active RETURNING id,name,email,role,permissions,is_active`,
      [s.id,s.name,s.email,s.role,hash||'',JSON.stringify(s.permissions||{}),s.isActive!==false]);
    res.json(rows[0]);}
  catch(e){res.status(500).json({error:e.message})}});

router.put('/staff/:id/password', requirePlatformAdmin, async(req,res)=>{
  const hash = await bcrypt.hash(req.body.password, 10);
  try{await pool.query('UPDATE platform_staff SET password_hash=$2 WHERE id=$1',[req.params.id,hash]);res.json({success:true});}
  catch(e){res.status(500).json({error:e.message})}});

// Notif settings
router.get('/notif', requirePlatformAdmin, async(req,res)=>{
  try{const{rows}=await pool.query('SELECT * FROM notif_settings LIMIT 1');res.json(rows[0]||{});}
  catch(e){res.status(500).json({error:e.message})}});

router.put('/notif', requirePlatformAdmin, async(req,res)=>{
  const s=req.body;
  try{const{rows}=await pool.query(
    `INSERT INTO notif_settings(renewal_days,block_on_expiry,auto_billing,email_alerts)
     VALUES($1,$2,$3,$4)
     ON CONFLICT DO UPDATE SET renewal_days=$1,block_on_expiry=$2,auto_billing=$3,email_alerts=$4,updated_at=NOW() RETURNING *`,
    [s.renewalDays||30,s.blockOnExpiry||false,s.autoBilling||false,s.emailAlerts!==false]);
  res.json(rows[0]);}
  catch(e){res.status(500).json({error:e.message})}});

// License tiers
router.get('/tiers', requirePlatformAdmin, async(req,res)=>{
  try{const{rows}=await pool.query('SELECT * FROM license_tiers ORDER BY price');res.json(rows);}
  catch(e){res.status(500).json({error:e.message})}});

router.post('/tiers', requirePlatformAdmin, async(req,res)=>{
  const t=req.body;
  try{const{rows}=await pool.query(
    `INSERT INTO license_tiers(id,label,price,max_staff,color,features)
     VALUES($1,$2,$3,$4,$5,$6)
     ON CONFLICT(id) DO UPDATE SET label=EXCLUDED.label,price=EXCLUDED.price,max_staff=EXCLUDED.max_staff,color=EXCLUDED.color RETURNING *`,
    [t.id,t.label,t.price,t.maxStaff||t.max_staff,t.color||'#4F6EF7',JSON.stringify(t.features||[])]);
  res.json(rows[0]);}
  catch(e){res.status(500).json({error:e.message})}});

module.exports = router;
