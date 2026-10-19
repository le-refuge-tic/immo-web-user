import { describe, it, expect } from 'vitest'
import { isSafePaymentUrl } from '../paymentUrl'

describe('isSafePaymentUrl', () => {
  it.each([
    'https://checkout.fedapay.com/abc',
    'https://sandbox-process.fedapay.com/x?y=1',
    'https://fedapay.com/pay',
  ])('accepte %s', (u) => expect(isSafePaymentUrl(u)).toBe(true))

  it.each([
    'javascript:alert(1)',
    'http://checkout.fedapay.com/abc',
    'https://evil.com/fedapay.com',
    'https://fedapay.com.evil.com/x',
    'https://notfedapay.com/x',
    'https://user:pw@checkout.fedapay.com/x',
    'data:text/html,<script>1</script>',
    '',
    'pas une url',
  ])('refuse %s', (u) => expect(isSafePaymentUrl(u)).toBe(false))

  it('refuse les non-chaînes', () => {
    expect(isSafePaymentUrl(undefined)).toBe(false)
    expect(isSafePaymentUrl(42)).toBe(false)
  })
})
