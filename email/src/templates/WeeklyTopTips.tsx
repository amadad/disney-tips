import {
  Section,
  Text,
  Button,
  Hr,
  Row,
  Column,
} from '@react-email/components'
import * as React from 'react'
import EmailLayout from '../components/EmailLayout'
import { emailColors, emailSpacing, text, divider, emailButton } from '../tokens'

export interface TipEmail {
  text: string
  category: string
  park?: string
  priority: 'high' | 'medium' | 'low'
  source: { channelName: string; videoId: string }
}

interface WeeklyTopTipsProps {
  weekOf: string
  tips: TipEmail[]
  totalNewTips: number
}

function formatCategory(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

function formatPark(park: string | undefined): string | null {
  if (!park || park === 'all-parks') return null
  return park
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const priorityColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
}

export default function WeeklyTopTips({
  weekOf,
  tips,
  totalNewTips,
}: WeeklyTopTipsProps): React.ReactElement {
  const previewText = `${tips.length} top Disney tips this week — ${totalNewTips} new tips added`
  const [featured, ...rest] = tips

  return (
    <EmailLayout previewText={previewText}>
      {/* Gold hero banner */}
      <Section style={heroBanner}>
        <Text style={heroEmoji}>🏰</Text>
        <Text style={heroTitle}>Top Tips This Week</Text>
        <Text style={heroSubtitle}>Week of {weekOf}</Text>
      </Section>

      {/* Featured tip */}
      {featured && (
        <Section style={featuredCard}>
          <Text style={featuredLabel}>
            <span style={{ color: '#fcd34d' }}>★</span> FEATURED TIP
          </Text>
          <Text style={featuredText}>{featured.text}</Text>
          <Text style={featuredMeta}>
            <span style={pillStyle}>{formatCategory(featured.category)}</span>
            {formatPark(featured.park) && (
              <span style={pillStyle}>{formatPark(featured.park)}</span>
            )}
            <span style={{ ...pillStyle, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: priorityColors[featured.priority], color: priorityColors[featured.priority] }}>
              {featured.priority}
            </span>
          </Text>
          <Text style={sourceStyle}>via {featured.source.channelName}</Text>
        </Section>
      )}

      {/* Remaining tips */}
      {rest.map((tip, i) => {
        const parkLabel = formatPark(tip.park)

        return (
          <Section key={i} style={cardStyle}>
            <Row>
              <Column style={numberCol}>
                <Text style={numberStyle}>{String(i + 2).padStart(2, '0')}</Text>
              </Column>
              <Column style={contentCol}>
                <Text style={tipTextStyle}>{tip.text}</Text>
                <Text style={metaRow}>
                  <span style={pillSmall}>{formatCategory(tip.category)}</span>
                  {parkLabel && <span style={pillSmall}>{parkLabel}</span>}
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                    {' '}via {tip.source.channelName}
                  </span>
                </Text>
              </Column>
            </Row>
          </Section>
        )
      })}

      {/* Summary CTA */}
      <Hr style={divider} />
      <Section style={ctaSection}>
        <Text style={ctaCount}>{totalNewTips}</Text>
        <Text style={ctaLabel}>new tips added this week</Text>
        <Button href="https://disney.bound.tips" style={emailButton.primary}>
          Browse All Tips →
        </Button>
      </Section>
    </EmailLayout>
  )
}

// -- Hero banner --
const heroBanner = {
  backgroundColor: '#021024',
  borderRadius: '8px 8px 0 0',
  padding: '32px 24px 24px',
  textAlign: 'center' as const,
  borderBottom: '3px solid #fcd34d',
}

const heroEmoji = {
  fontSize: '40px',
  lineHeight: '1',
  margin: '0 0 8px 0',
}

const heroTitle = {
  fontSize: '28px',
  fontWeight: '400' as const,
  fontFamily: 'Georgia, "Times New Roman", Times, serif',
  color: '#ffffff',
  letterSpacing: '-0.01em',
  margin: '0 0 4px 0',
}

const heroSubtitle = {
  fontSize: '14px',
  fontWeight: '400' as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: '#9ca3af',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  margin: '0',
}

// -- Featured tip --
const featuredCard = {
  backgroundColor: '#051630',
  padding: '24px',
  borderRadius: '0 0 8px 8px',
  marginBottom: emailSpacing.block,
}

const featuredLabel = {
  fontSize: '11px',
  fontWeight: '700' as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  color: '#fcd34d',
  margin: '0 0 12px 0',
}

const featuredText = {
  fontSize: '20px',
  fontWeight: '400' as const,
  lineHeight: '1.6',
  fontFamily: 'Georgia, "Times New Roman", Times, serif',
  color: '#f3f4f6',
  margin: '0 0 16px 0',
}

const featuredMeta = {
  margin: '0 0 12px 0',
  lineHeight: '2',
}

const pillStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: 600,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  color: '#fcd34d',
  backgroundColor: 'rgba(252, 211, 77, 0.12)',
  border: '1px solid rgba(252, 211, 77, 0.25)',
  borderRadius: '999px',
  padding: '3px 10px',
  marginRight: '6px',
}

const sourceStyle = {
  fontSize: '13px',
  fontStyle: 'italic' as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: '#6b7280',
  margin: '0',
}

// -- Regular tip cards --
const cardStyle = {
  backgroundColor: '#051630',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  padding: '16px 20px',
  marginBottom: '10px',
}

const numberCol = {
  width: '44px',
  verticalAlign: 'top' as const,
}

const numberStyle = {
  fontSize: '24px',
  fontWeight: '300' as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: 'rgba(252, 211, 77, 0.4)',
  margin: '0',
  lineHeight: '1.4',
}

const contentCol = {
  verticalAlign: 'top' as const,
  paddingLeft: '4px',
}

const tipTextStyle = {
  fontSize: '16px',
  fontWeight: '400' as const,
  lineHeight: '1.55',
  fontFamily: 'Georgia, "Times New Roman", Times, serif',
  color: '#e5e7eb',
  margin: '0 0 8px 0',
}

const metaRow = {
  margin: '0',
  lineHeight: '1.8',
}

const pillSmall: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: 600,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  color: '#fcd34d',
  backgroundColor: 'rgba(252, 211, 77, 0.08)',
  border: '1px solid rgba(252, 211, 77, 0.15)',
  borderRadius: '999px',
  padding: '2px 8px',
  marginRight: '5px',
}

// -- CTA section --
const ctaSection = {
  textAlign: 'center' as const,
  padding: `0 0 ${emailSpacing.block} 0`,
}

const ctaCount = {
  fontSize: '48px',
  fontWeight: '300' as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: emailColors.text.primary,
  lineHeight: '1',
  margin: '0',
}

const ctaLabel = {
  fontSize: '14px',
  fontWeight: '400' as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: emailColors.text.muted,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: `4px 0 ${emailSpacing.block} 0`,
}
