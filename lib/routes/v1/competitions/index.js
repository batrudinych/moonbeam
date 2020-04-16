'use strict'

const router = require('express').Router()
const { getSchemaValidationMw, checkAuth, asyncMw } = require('../../../helpers/middlewares')
const { sendNotFoundError, processCompetitionsError, verifyCompetitionParams } = require('../../../helpers/utils')
const { tradingCompetitionRequest } = require('../../../helpers/grenache')
const { auth } = require('../../../helpers/schemas')

router.get('/', asyncMw(async (req, res) => {
  const result = await tradingCompetitionRequest({ action: 'listCompetitions' })
  if (!result.success) return processCompetitionsError(result.message, res)

  res.status(200).json(result.data)
}))

router.get('/active', async (req, res, next) => {
  try {
    const result = await tradingCompetitionRequest({ action: 'getActiveCompetition' })
    if (!result.success) return processCompetitionsError(result.message, res)
    if (!result.data || !result.data.competition) return sendNotFoundError(res)

    res.status(200).json(result.data)
  } catch (e) {
    next(e)
  }
})

router.get('/:id', verifyCompetitionParams(['id']), asyncMw(async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const result = await tradingCompetitionRequest({ action: 'getCompetition', args: [{ competitionId: id }] })

  if (!result.success) return processCompetitionsError(result.message, res)
  if (!result.data || !result.data.competition) return sendNotFoundError(res)

  res.status(200).json(result.data)
}))

router.get('/:id/leaderboard/:type', verifyCompetitionParams(['id', 'type']), asyncMw(async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { type } = req.params
  const result = await tradingCompetitionRequest({
    action: 'getCompetitionLeaderboard',
    args: [{ competitionId: id, type }]
  })

  if (!result.success) return processCompetitionsError(result.message, res)

  res.status(200).json(result.data)
}))

router.post('/:id/signup/status', verifyCompetitionParams(['id']), getSchemaValidationMw(auth), checkAuth,
  asyncMw(async (req, res) => {
    const { txObj } = req.body._validated.authTx
    const user = txObj.actions[0].authorization[0].actor
    const id = parseInt(req.params.id, 10)
    const result = await tradingCompetitionRequest({
      action: 'getSubscription',
      args: [{ competitionId: id, userName: user }]
    })

    if (!result.success) return processCompetitionsError(result.message, res)
    if (!result.data || !result.data.subscription) return sendNotFoundError(res)

    res.status(200).send(result.data)
  }))

router.post('/:id/signup', verifyCompetitionParams(['id']), getSchemaValidationMw(auth), checkAuth,
  asyncMw(async (req, res) => {
    const { txObj } = req.body._validated.authTx
    const user = txObj.actions[0].authorization[0].actor
    const id = parseInt(req.params.id, 10)
    const result = await tradingCompetitionRequest({
      action: 'addSubscription',
      args: [{ competitionId: id, userName: user }]
    })

    if (!result.success) return processCompetitionsError(result.message, res)

    res.status(200).send(result.data)
  }))

module.exports = router