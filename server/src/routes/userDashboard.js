import { Router } from 'express'
import { pool } from '../db.js'
import { authenticateUser } from '../middleware/authenticateUser.js'

const router = Router()

router.get('/account/dashboard', authenticateUser, async (request, response, next) => {
  try {
    const { rows: accounts } = await pool.query(
      `SELECT id, full_name AS "fullName", phone, email, city, country
       FROM user_accounts WHERE id = $1`,
      [request.user.id],
    )
    const account = accounts[0]
    if (!account) return response.status(401).json({ message: 'User account not found.' })

    const classes = await pool.query(
        `SELECT cr.id, cr.class_title AS "classTitle", cr.payment_status AS "paymentStatus",
          cr.payment_method AS "paymentMethod", cr.created_at AS "createdAt",
          CASE WHEN cr.payment_status = 'VERIFIED' THEN COALESCE(uc.meeting_url, '') ELSE '' END AS "meetingUrl"
         FROM class_registrations cr
         LEFT JOIN upcoming_classes uc ON uc.id = cr.class_id
         WHERE cr.user_id = $1
         ORDER BY cr.created_at DESC, cr.id DESC`,
        [account.id],
      )
    const deeksha = await pool.query(
        `SELECT ds.id, ds.selected_programs AS "selectedPrograms", ds.created_at AS "createdAt",
          COALESCE(
            jsonb_agg(
              jsonb_build_object('id', dp.id, 'title', dp.title, 'meetingUrl', dp.meeting_url)
              ORDER BY dp.sort_order ASC, dp.id ASC
            ) FILTER (WHERE dp.id IS NOT NULL AND dp.meeting_url <> ''),
            '[]'::jsonb
          ) AS "meetingLinks"
         FROM deeksha_submissions ds
         LEFT JOIN LATERAL jsonb_array_elements(ds.selected_programs) AS selected_program ON TRUE
         LEFT JOIN deeksha_programs dp
           ON (selected_program ->> 'id') ~ '^[0-9]+$'
          AND dp.id = (selected_program ->> 'id')::bigint
         WHERE ds.user_id = $1
         GROUP BY ds.id
         ORDER BY MAX(ds.created_at) DESC, ds.id DESC`,
        [account.id],
      )

    response.set('Cache-Control', 'private, no-store')
    return response.json({
      user: { ...account, id: String(account.id), phone: account.phone ? `+${account.phone}` : null },
      classRegistrations: classes.rows.map((item) => ({ ...item, id: String(item.id) })),
      deekshaSubmissions: deeksha.rows.map((item) => ({ ...item, id: String(item.id) })),
    })
  } catch (error) {
    return next(error)
  }
})

export { router as userDashboardRouter }
