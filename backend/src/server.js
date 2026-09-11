import 'dotenv/config'
import basicAuth from 'express-basic-auth'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { PrismaClient, Prisma } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()
const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

const adminAuth = basicAuth({
  users: { 'admin': 'library2026' },
  challenge: true,
  unauthorizedResponse: 'Unauthorized access.'
})
const bookInput = z.object({
  title: z.string().trim().min(1),
  author: z.string().trim().min(1),
  isbn: z.string().trim().min(1),
  category: z.string().trim().min(1),
  totalCopies: z.coerce.number().int().positive()
})
const issueInput = z.object({
  bookId: z.string().min(1),
  borrowerName: z.string().trim().min(1),
  borrowerId: z.string().trim().min(1),
  dueDate: z.coerce.date()
})

const bookSelect = {
  id: true, title: true, author: true, isbn: true, category: true,
  totalCopies: true, availableCopies: true, createdAt: true
}
const serializeTransaction = (transaction) => ({
  ...transaction,
  bookTitle: transaction.book?.title,
  bookAuthor: transaction.book?.author,
  bookIsbn: transaction.book?.isbn
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/books', async (req, res, next) => {
  try {
    const { search = '', category, status } = req.query
    const books = await prisma.book.findMany({
      where: {
        ...(search ? { OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
          { isbn: { contains: search, mode: 'insensitive' } }
        ] } : {}),
        ...(category && category !== 'All categories' ? { category } : {}),
        ...(status === 'AVAILABLE' ? { availableCopies: { gt: 0 } } : {}),
        ...(status === 'ISSUED' ? { availableCopies: 0 } : {})
      },
      select: bookSelect,
      orderBy: { createdAt: 'desc' }
    })
    res.json(books)
  } catch (error) { next(error) }
})

app.post('/api/books', adminAuth, async (req, res, next) => {
  try {
    const data = bookInput.parse(req.body)
    const book = await prisma.book.create({ data: { ...data, availableCopies: data.totalCopies }, select: bookSelect })
    res.status(201).json(book)
  } catch (error) { next(error) }
})

app.delete('/api/books/:id', adminAuth, async (req, res, next) => {
  try {
    const active = await prisma.transaction.count({ where: { bookId: req.params.id, status: 'ISSUED' } })
    if (active) return res.status(409).json({ message: 'Return all active copies before removing this book.' })
    await prisma.book.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (error) { next(error) }
})

app.get('/api/transactions', async (_req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({ include: { book: true }, orderBy: { issueDate: 'desc' } })
    res.json(transactions.map(serializeTransaction))
  } catch (error) { next(error) }
})

app.post('/api/transactions/issue', async (req, res, next) => {
  try {
    const data = issueInput.parse(req.body)
    const transaction = await prisma.$transaction(async (tx) => {
      const updated = await tx.book.updateMany({ where: { id: data.bookId, availableCopies: { gt: 0 } }, data: { availableCopies: { decrement: 1 } } })
      if (!updated.count) throw new Error('BOOK_UNAVAILABLE')
      return tx.transaction.create({ data, include: { book: true } })
    })
    res.status(201).json(serializeTransaction(transaction))
  } catch (error) { next(error) }
})

app.post('/api/transactions/:id/return', async (req, res, next) => {
  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const active = await tx.transaction.findFirst({ where: { id: req.params.id, status: 'ISSUED' } })
      if (!active) throw new Error('ISSUE_NOT_FOUND')
      const updated = await tx.transaction.update({ where: { id: active.id }, data: { status: 'RETURNED', returnDate: new Date() }, include: { book: true } })
      await tx.book.update({ where: { id: active.bookId }, data: { availableCopies: { increment: 1 } } })
      return updated
    })
    res.json(serializeTransaction(transaction))
  } catch (error) { next(error) }
})

app.get('/api/analytics', async (_req, res, next) => {
  try {
    const [bookStats, issued, overdue] = await Promise.all([
      prisma.book.aggregate({ _sum: { totalCopies: true, availableCopies: true }, _count: { _all: true } }),
      prisma.transaction.findMany({ where: { status: 'ISSUED' }, include: { book: true }, orderBy: { dueDate: 'asc' } }),
      prisma.transaction.count({ where: { status: 'ISSUED', dueDate: { lt: new Date() } } })
    ])
    res.json({
      totalBooks: bookStats._count._all,
      availableCopies: bookStats._sum.availableCopies || 0,
      issuedCopies: (bookStats._sum.totalCopies || 0) - (bookStats._sum.availableCopies || 0),
      overdueBooks: overdue,
      issued: issued.map(serializeTransaction)
    })
  } catch (error) { next(error) }
})

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) return res.status(400).json({ message: error.issues[0].message })
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return res.status(409).json({ message: 'ISBN / Book ID already exists.' })
  if (error.message === 'BOOK_UNAVAILABLE') return res.status(409).json({ message: 'This title is currently unavailable.' })
  if (error.message === 'ISSUE_NOT_FOUND') return res.status(409).json({ message: 'This transaction is already returned or does not exist.' })
  console.error(error)
  res.status(500).json({ message: 'Something went wrong on the server.' })
})

app.listen(port, () => console.log(`Library API listening on http://localhost:${port}`))
