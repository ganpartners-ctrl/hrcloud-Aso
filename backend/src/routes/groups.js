// src/routes/groups.js
const router = require('express').Router();
const pool   = require('../db/pool');
const { requirePlatformAdmin } = require('../middleware/auth');

router.get('/',     requirePlatformAdmin, async (req,res)=>{ try{const{rows}=await pool.query('SELECT * FROM company_groups ORDER BY name');res.json(rows);}catch(e){res.status(500).json({error:e.message})}});
router.post('/',    requirePlatformAdmin, async (req,res)=>{ const g=req.body; try{const{rows}=await pool.query('INSERT INTO company_groups(id,name,color,member_ids)VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,color=EXCLUDED.color,member_ids=EXCLUDED.member_ids RETURNING *',[g.id||`GRP-${Date.now()}`,g.name,g.color||'#4F6EF7',JSON.stringify(g.memberIds||g.member_ids||[])]);res.json(rows[0]);}catch(e){res.status(500).json({error:e.message})}});
router.delete('/:id',requirePlatformAdmin,async(req,res)=>{ try{await pool.query('DELETE FROM company_groups WHERE id=$1',[req.params.id]);res.json({success:true});}catch(e){res.status(500).json({error:e.message})}});
module.exports = router;
