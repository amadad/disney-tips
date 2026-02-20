import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components'
import * as React from 'react'
import { emailColors, emailSpacing, emailCompat, divider } from '../tokens'

interface EmailLayoutProps {
  previewText: string
  children: React.ReactNode
}

export default function EmailLayout({
  previewText,
  children,
}: EmailLayoutProps): React.ReactElement {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Disney Parks Tips</title>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={wordmarkStyle}>DISNEY PARKS TIPS</Text>
            <Hr style={headerRule} />
          </Section>

          {/* Content */}
          {children}

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Disney Parks Tips &middot;{' '}
              <Link href="https://disney.bound.tips" style={footerLinkStyle}>
                disney.bound.tips
              </Link>
            </Text>
            <Link href="{{{RESEND_UNSUBSCRIBE_URL}}}" style={unsubscribeLinkStyle}>
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle = {
  backgroundColor: emailColors.background.primary,
  fontFamily: emailCompat.fontStack.sansSerif,
  margin: '0',
  padding: '0',
  width: '100%',
}

const containerStyle = {
  margin: '20px auto',
  maxWidth: '560px',
  padding: '0 24px',
  backgroundColor: emailColors.background.primary,
}

const headerStyle = {
  padding: `${emailSpacing.section} 0 ${emailSpacing.block} 0`,
}

const wordmarkStyle = {
  fontSize: '11px',
  fontWeight: '600' as const,
  fontFamily: emailCompat.fontStack.sansSerif,
  letterSpacing: '0.15em',
  color: emailColors.text.muted,
  margin: '0 0 12px 0',
}

const headerRule = {
  borderColor: emailColors.border.light,
  margin: '0',
}

const footerStyle = {
  padding: `${emailSpacing.block} 0`,
  textAlign: 'center' as const,
}

const footerTextStyle = {
  fontSize: '14px',
  fontWeight: '400' as const,
  lineHeight: '1.5',
  fontFamily: emailCompat.fontStack.sansSerif,
  color: emailColors.text.muted,
  margin: '0',
}

const footerLinkStyle = {
  color: emailColors.text.muted,
  textDecoration: 'underline',
}

const unsubscribeLinkStyle = {
  fontSize: '14px',
  fontWeight: '400' as const,
  lineHeight: '1.5',
  fontFamily: emailCompat.fontStack.sansSerif,
  color: emailColors.text.muted,
  textDecoration: 'underline',
  marginTop: '12px',
  display: 'inline-block',
}
