// =====================================================
// Server-Side Barcode Generator
// =====================================================

import { createCanvas } from 'canvas'
import QRCode from 'qrcode'

// EAN-13 check digit calculation
function calculateEAN13CheckDigit(code: string): string {
  if (code.length !== 12) {
    throw new Error('EAN-13 requires exactly 12 digits before check digit')
  }
  
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i])
    sum += digit * (i % 2 === 0 ? 1 : 3)
  }
  
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit.toString()
}

// Validate EAN-13 format
function validateEAN13(code: string): boolean {
  if (!/^\d{12,13}$/.test(code)) {
    return false
  }
  
  if (code.length === 12) {
    code = code + calculateEAN13CheckDigit(code)
  }
  
  // Verify check digit
  const checkDigit = calculateEAN13CheckDigit(code.slice(0, 12))
  return checkDigit === code[12]
}

// Generate EAN-13 barcode pattern
function generateEAN13Pattern(code: string): string {
  if (code.length === 12) {
    code = code + calculateEAN13CheckDigit(code)
  }
  
  if (!validateEAN13(code)) {
    throw new Error('Invalid EAN-13 code')
  }
  
  // EAN-13 encoding patterns
  const leftPatterns = {
    '0': '0001101', '1': '0011001', '2': '0010011', '3': '0111101',
    '4': '0100011', '5': '0110001', '6': '0101111', '7': '0111011',
    '8': '0110111', '9': '0001011'
  }
  
  const rightPatterns = {
    '0': '1110010', '1': '1100110', '2': '1101100', '3': '1000010',
    '4': '1011100', '5': '1001110', '6': '1010000', '7': '1000100',
    '8': '1001000', '9': '1110100'
  }
  
  const guardPattern = '101'
  const centerPattern = '01010'
  
  let pattern = guardPattern // Start guard
  
  // First 6 digits (left side)
  for (let i = 0; i < 6; i++) {
    pattern += leftPatterns[code[i] as keyof typeof leftPatterns]
  }
  
  pattern += centerPattern // Center guard
  
  // Last 6 digits (right side)
  for (let i = 6; i < 12; i++) {
    pattern += rightPatterns[code[i] as keyof typeof rightPatterns]
  }
  
  pattern += guardPattern // End guard
  
  return pattern
}

// Generate Code 128 barcode pattern
function generateCode128Pattern(text: string): string {
  // Code 128 character set A (simplified)
  const charSetA: Record<string, string> = {
    ' ': '11011001100', '!': '11001101100', '"': '11001100110',
    '#': '10010011000', '$': '10010001100', '%': '10001001100',
    '&': '10011001000', "'": '10011000100', '(': '10001100100',
    ')': '11001001000', '*': '11001000100', '+': '11000100100',
    ',': '10110011100', '-': '10011011100', '.': '10011001110',
    '/': '10111001100', '0': '10011101100', '1': '10011100110',
    '2': '11001110010', '3': '11001011100', '4': '11001001110',
    '5': '11011100100', '6': '11001110100', '7': '11101101110',
    '8': '11101001100', '9': '11100101100', ':': '11100100110',
    ';': '11101100100', '<': '11100110100', '=': '11100110010',
    '>': '11011011000', '?': '11011000110', '@': '11000110110',
    'A': '10100011000', 'B': '10001011000', 'C': '10001000110',
    'D': '10110001000', 'E': '10001101000', 'F': '10001100010',
    'G': '11010001000', 'H': '11000101000', 'I': '11000100010',
    'J': '10110111000', 'K': '10110001110', 'L': '10001101110',
    'M': '10111011000', 'N': '10111000110', 'O': '10001110110',
    'P': '11101110110', 'Q': '11010001110', 'R': '11000101110',
    'S': '11011101000', 'T': '11011100010', 'U': '11011101110',
    'V': '11101011000', 'W': '11101000110', 'X': '11100010110',
    'Y': '11101101000', 'Z': '11101100010'
  }
  
  // Start character (Code A)
  let pattern = '11010000100'
  
  // Encode each character
  for (const char of text.toUpperCase()) {
    if (charSetA[char]) {
      pattern += charSetA[char]
    } else {
      // Use space for unknown characters
      pattern += charSetA[' ']
    }
  }
  
  // Calculate and add check digit (simplified)
  let checksum = 103 // Start character value
  for (let i = 0; i < text.length; i++) {
    const char = text[i].toUpperCase()
    const value = Object.keys(charSetA).indexOf(char)
    checksum += (value + 1) * (i + 1)
  }
  checksum = checksum % 103
  
  // Add check digit
  const checkChar = Object.keys(charSetA)[checksum]
  pattern += charSetA[checkChar]
  
  // Stop character
  pattern += '1100011101011'
  
  return pattern
}

// Create barcode canvas
function createBarcodeCanvas(pattern: string, text: string, type: string): Buffer {
  const barWidth = 2
  const barHeight = 80
  const textHeight = 20
  const padding = 10
  
  const canvas = createCanvas(
    pattern.length * barWidth + padding * 2,
    barHeight + textHeight + padding * 2
  )
  const ctx = canvas.getContext('2d')
  
  // White background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw bars
  ctx.fillStyle = 'black'
  let x = padding
  for (const bit of pattern) {
    if (bit === '1') {
      ctx.fillRect(x, padding, barWidth, barHeight)
    }
    x += barWidth
  }
  
  // Draw text
  ctx.fillStyle = 'black'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(text, canvas.width / 2, barHeight + padding + 15)
  
  return canvas.toBuffer('image/png')
}

// Generate QR code
async function generateQRCode(text: string): Promise<Buffer> {
  const canvas = createCanvas(200, 200)
  const ctx = canvas.getContext('2d')
  
  // White background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, 200, 200)
  
  // Generate QR code
  const qrDataURL = await QRCode.toDataURL(text, {
    width: 180,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  })
  
  // Convert data URL to buffer
  const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

// Main barcode generation function
export async function generateBarcode(
  value: string,
  type: 'EAN13' | 'CODE128' | 'QR',
  productUrl?: string
): Promise<Buffer> {
  try {
    switch (type) {
      case 'EAN13':
        // Ensure 12-13 digits
        let eanValue = value.replace(/\D/g, '').slice(0, 13)
        if (eanValue.length < 12) {
          eanValue = eanValue.padStart(12, '0')
        }
        
        if (!validateEAN13(eanValue)) {
          throw new Error('Invalid EAN-13 value')
        }
        
        const eanPattern = generateEAN13Pattern(eanValue)
        return createBarcodeCanvas(eanPattern, eanValue, 'EAN-13')
        
      case 'CODE128':
        if (!value || value.length === 0) {
          throw new Error('CODE128 requires a non-empty value')
        }
        
        const code128Pattern = generateCode128Pattern(value)
        return createBarcodeCanvas(code128Pattern, value, 'CODE128')
        
      case 'QR':
        // Use product URL if provided, otherwise use the value
        const qrValue = productUrl || value
        return await generateQRCode(qrValue)
        
      default:
        throw new Error(`Unsupported barcode type: ${type}`)
    }
  } catch (error) {
    console.error('Barcode generation error:', error)
    throw error
  }
}

// Helper function to create product URL
export function createProductUrl(sku: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/p/${sku}`
}

// Validate barcode value for type
export function validateBarcodeValue(value: string, type: 'EAN13' | 'CODE128' | 'QR'): boolean {
  switch (type) {
    case 'EAN13':
      return /^\d{12,13}$/.test(value) && validateEAN13(value)
    case 'CODE128':
      return value.length > 0 && value.length <= 50
    case 'QR':
      return value.length > 0 && value.length <= 2000
    default:
      return false
  }
}
