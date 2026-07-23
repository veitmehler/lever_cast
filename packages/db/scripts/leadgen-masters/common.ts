/** Shared bits for the five master specs (leadgen master-library plan Phase C). */

export function disclaimer(title: string): string {
  return (
    `This guide ("${title}") is provided for general educational purposes only and is not a ` +
    'substitute for professional diagnosis, advice, or treatment. Always consult a qualified ' +
    'healthcare provider about your individual situation before starting new exercises or ' +
    'self-care routines. If you experience severe pain, numbness, weakness, or any of the ' +
    'warning signs described in this guide, seek professional care promptly. ' +
    '© {{brand.organizationName}}. You are welcome to share this guide in its complete, unmodified form.'
  )
}
