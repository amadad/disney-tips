import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Row,
  Column,
  Hr,
} from '@react-email/components'
import * as React from 'react'

type CallTone = 'buy' | 'book' | 'skip' | 'protect' | 'watch'

interface PlanCall {
  tone: CallTone
  label: string
  title: string
  decision: string
  why: string
}

interface AppliedTip {
  source: string
  tip: string
  applies: string
}

interface SpendItem {
  label: string
  reason: string
}

interface TimelineItem {
  when: string
  action: string
}

interface TripDay {
  day: string
  date: string
  park: string
  morning: string
  midday: string
  evening: string
  callout: string
}

interface FamilyPlanProps {
  familyName: string
  destination: string
  dates: string
  hotel: string
  party: string
  budget: string
  priorities: string[]
  calls: PlanCall[]
  appliedTips: AppliedTip[]
  worthIt: SpendItem[]
  maybe: SpendItem[]
  skip: SpendItem[]
  timeline: TimelineItem[]
  tripDays: TripDay[]
  backupPlan: string
  replyPrompt: string
}

export const sampleFamilyPlan: FamilyPlanProps = {
  familyName: 'Maya',
  destination: 'Walt Disney World',
  dates: 'Oct 12-18',
  hotel: 'Pop Century',
  party: '2 adults, kids 4 and 8',
  budget: 'Balanced',
  priorities: ['Slinky Dog', 'princess meal', 'fireworks', 'low-thrill rides'],
  calls: [
    {
      tone: 'skip',
      label: 'Skip',
      title: 'Park Hopper',
      decision: 'Do not buy Park Hopper for this trip.',
      why: 'Your resort makes EPCOT and Hollywood Studios easy, but midday park transfers add friction for a 4-year-old.',
    },
    {
      tone: 'buy',
      label: 'Buy',
      title: 'Lightning Lane for MK + HS',
      decision: 'Buy for Magic Kingdom and Hollywood Studios only.',
      why: 'Those are the two days where it protects the must-dos and keeps the afternoon break intact.',
    },
    {
      tone: 'book',
      label: 'Book',
      title: 'One character meal',
      decision: 'Book one character meal, not three.',
      why: 'A single anchor meal gives the kids the moment without turning the week into table-service logistics.',
    },
    {
      tone: 'protect',
      label: 'Protect',
      title: 'Fireworks night',
      decision: 'Make the fireworks day a pool-break day.',
      why: 'The plan fails if everyone is already cooked by 7 PM.',
    },
  ],
  appliedTips: [
    {
      source: 'DFB Guide signal',
      tip: 'Slinky Dog Dash demand moves early and stays stubborn.',
      applies: 'Put Hollywood Studios early in the trip and protect Slinky Dog with either rope drop or Lightning Lane.',
    },
    {
      source: 'AllEars signal',
      tip: 'Mobile order works best when you place lunch before peak hunger.',
      applies: 'Order before the family leaves the morning ride cluster, not when everyone is already tired.',
    },
    {
      source: 'Resort transport signal',
      tip: 'Skyliner resorts are strongest when you avoid unnecessary transfers.',
      applies: 'Use Pop Century as an EPCOT/HS advantage, but avoid hopping just because the route exists.',
    },
  ],
  worthIt: [
    { label: 'MK Lightning Lane', reason: 'protects the broadest ride list' },
    { label: 'HS Lightning Lane', reason: 'protects Slinky Dog and Toy Story Land' },
  ],
  maybe: [
    { label: 'Dessert party', reason: 'only if fireworks are the top memory' },
    { label: 'Extra character meal', reason: 'only if the first booking is unavailable' },
  ],
  skip: [
    { label: 'Park Hopper', reason: 'too much transfer cost for this party' },
    { label: 'AK Lightning Lane', reason: 'buy only if waits spike that week' },
  ],
  timeline: [
    { when: 'Now', action: 'Decide tickets without Park Hopper.' },
    { when: '60 days out', action: 'Book one character meal and one backup time.' },
    { when: '7 days out', action: 'Choose Lightning Lane priorities for MK and HS.' },
    { when: 'Park day', action: 'Mobile order lunch before the morning group gets hungry.' },
  ],
  tripDays: [
    {
      day: 'Day 1',
      date: 'Sun Oct 12',
      park: 'Arrival + Pop Century',
      morning: 'Travel, check in, and do not schedule a park.',
      midday: 'Pool, room setup, stroller check, and grocery/snack reset.',
      evening: 'Quick dinner at the resort. Early bedtime so Monday can start clean.',
      callout: 'Do not burn a ticket on arrival day.',
    },
    {
      day: 'Day 2',
      date: 'Mon Oct 13',
      park: 'Magic Kingdom',
      morning: 'Buy Lightning Lane. Rope drop Fantasyland, then Peter Pan, Small World, Haunted Mansion.',
      midday: 'Mobile order lunch before 11:15. Leave by 1:15 for Pop Century pool/rest.',
      evening: 'Return for two priorities, snacks, and fireworks only if everyone recovered.',
      callout: 'This is the highest-pressure day, so protect the break.',
    },
    {
      day: 'Day 3',
      date: 'Tue Oct 14',
      park: 'Hollywood Studios',
      morning: 'Protect Slinky Dog with rope drop or Lightning Lane. Stay in Toy Story Land first.',
      midday: 'Early lunch, then shows or low-wait rides. Leave before the heat peak.',
      evening: 'One character meal or Fantasmic, not both unless naps went well.',
      callout: 'Slinky Dog is the anchor; everything else flexes around it.',
    },
    {
      day: 'Day 4',
      date: 'Wed Oct 15',
      park: 'Resort morning + EPCOT',
      morning: 'Sleep in. No rope drop. Use the Skyliner advantage after the morning crowd surge.',
      midday: 'Enter EPCOT after rest, aim for Frozen or Remy, and keep food choices simple.',
      evening: 'Early dinner and one nighttime ride. Skip fireworks if the kids are fading.',
      callout: 'This is the reset day that keeps the back half usable.',
    },
    {
      day: 'Day 5',
      date: 'Thu Oct 16',
      park: 'Animal Kingdom half day',
      morning: 'Arrive early for safari, animals, and one headliner if waits are friendly.',
      midday: 'Leave after lunch. Do not force a full-day Animal Kingdom plan with this party.',
      evening: 'Resort dinner, laundry, and an early night before the final Magic Kingdom day.',
      callout: 'Skip advance Lightning Lane unless waits spike that week.',
    },
    {
      day: 'Day 6',
      date: 'Fri Oct 17',
      park: 'Magic Kingdom redo',
      morning: 'Repeat the kids favorite land first. Use this day to catch anything missed.',
      midday: 'Character meal if the preferred reservation is available; otherwise quick service and rest.',
      evening: 'Fireworks backup night. If Monday worked, leave early and end on an easy win.',
      callout: 'This is the memory-protection day, not a cram day.',
    },
    {
      day: 'Day 7',
      date: 'Sat Oct 18',
      park: 'Departure',
      morning: 'No park. Breakfast, packing, and one resort photo before travel.',
      midday: 'Leave buffer for transportation delays and tired kids.',
      evening: 'Do nothing scheduled.',
      callout: 'A clean departure beats squeezing in one more ride.',
    },
  ],
  backupPlan: 'If heat or rain breaks the day, cut the lowest-priority show, rest at Pop Century, and move fireworks to the next Magic Kingdom night.',
  replyPrompt: 'Reply with the one decision you still feel stuck on and I will tighten that part first.',
}

export default function FamilyPlan(props: FamilyPlanProps): React.ReactElement {
  const previewText = `${props.dates} full Disney trip plan that explains each choice`

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Your Disney family plan</title>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <meta name="x-apple-disable-message-reformatting" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={brandTopStyle}>
            <Text style={castleBadgeStyle}>🏰</Text>
            <Text style={brandLineStyle}>Disney Family Trip Planner</Text>
          </Section>

          <Section style={heroStyle}>
            <Text style={eyebrowStyle}>Disney family plan</Text>
            <Text style={titleStyle}>{props.dates} at {props.hotel}</Text>
            <Text style={ledeStyle}>
              Here is the full-trip structure I would follow, with the reason each major block exists.
            </Text>
          </Section>

          <Section style={ticketStyle}>
            <Row>
              <Column style={ticketColumn}>
                <Text style={ticketLabel}>Family</Text>
                <Text style={ticketValue}>{props.party}</Text>
              </Column>
              <Column style={ticketColumn}>
                <Text style={ticketLabel}>Budget</Text>
                <Text style={ticketValue}>{props.budget}</Text>
              </Column>
            </Row>
            <Text style={ticketLabel}>Must-dos</Text>
            <Text style={ticketValue}>{props.priorities.join(' + ')}</Text>
          </Section>

          <Section>
            <Text style={sectionTitle}>Plan sections</Text>
            <Row>
              <Column style={methodColumn}>
                <MethodStep number="1" title="Park order" body="Place park days, rest pressure, and flexible mornings around the family." />
              </Column>
              <Column style={methodColumn}>
                <MethodStep number="2" title="Reservations and spend" body="Tie dining and Lightning Lane choices to the days they actually help." />
              </Column>
              <Column style={methodColumn}>
                <MethodStep number="3" title="Backup moves" body="Choose what to cut when heat, rain, waits, or tired kids change the day." />
              </Column>
            </Row>
          </Section>

          <Section style={paperSection}>
            <Text style={sectionTitle}>Full trip plan</Text>
            {props.tripDays.map((tripDay, index) => (
              <TripDayCard key={index} tripDay={tripDay} />
            ))}
          </Section>

          <Section>
            <Text style={sectionTitle}>Trip-level choices</Text>
            {props.calls.map((call, index) => (
              <DecisionCall key={index} call={call} index={index + 1} />
            ))}
          </Section>

          <Section>
            <Text style={sectionTitle}>Spend / maybe / skip</Text>
            <Row>
              <Column style={thirdColumn}>
                <SpendColumn label="Worth it" color={colors.green} items={props.worthIt} />
              </Column>
              <Column style={thirdColumn}>
                <SpendColumn label="Maybe" color={colors.yellow} items={props.maybe} />
              </Column>
              <Column style={thirdColumn}>
                <SpendColumn label="Skip" color={colors.red} items={props.skip} />
              </Column>
            </Row>
          </Section>

          <Section style={paperSection}>
            <Text style={sectionTitle}>Planning notes</Text>
            {props.appliedTips.map((tip, index) => (
              <AppliedTipCard key={index} tip={tip} />
            ))}
          </Section>

          <Section>
            <Text style={sectionTitle}>Booking timeline</Text>
            {props.timeline.map((item, index) => (
              <TimelineRow key={index} item={item} />
            ))}
          </Section>

          <Section style={backupStyle}>
            <Text style={labelOnDark}>Bad-day backup</Text>
            <Text style={backupText}>{props.backupPlan}</Text>
          </Section>

          <Section style={replyStyle}>
            <Text style={replyTitle}>Your included follow-up</Text>
            <Text style={replyText}>{props.replyPrompt}</Text>
          </Section>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            Disney Family Trip Planner - disney.bound.tips
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

function DecisionCall({ call, index }: { call: PlanCall; index: number }): React.ReactElement {
  const toneColor = toneColors[call.tone]

  return (
    <Section style={callStyle}>
      <Row>
        <Column style={callNumberCol}>
          <Text style={{ ...callNumberStyle, backgroundColor: toneColor }}>{index}</Text>
        </Column>
        <Column>
          <Text style={{ ...callLabelStyle, color: toneColor }}>{call.label}</Text>
          <Text style={callTitleStyle}>{call.title}</Text>
          <Text style={callDecisionStyle}>{call.decision}</Text>
          <Text style={callWhyStyle}><strong>Because:</strong> {call.why}</Text>
        </Column>
      </Row>
    </Section>
  )
}

function MethodStep({
  number,
  title,
  body,
}: {
  number: string
  title: string
  body: string
}): React.ReactElement {
  return (
    <Section style={methodStyle}>
      <Text style={methodNumberStyle}>{number}</Text>
      <Text style={methodTitleStyle}>{title}</Text>
      <Text style={methodBodyStyle}>{body}</Text>
    </Section>
  )
}

function AppliedTipCard({ tip }: { tip: AppliedTip }): React.ReactElement {
  return (
    <Section style={tipCardStyle}>
      <Text style={tipSourceStyle}>{tip.source}</Text>
      <Text style={tipTextStyle}>{tip.tip}</Text>
      <Text style={tipApplyStyle}>{tip.applies}</Text>
    </Section>
  )
}

function TripDayCard({ tripDay }: { tripDay: TripDay }): React.ReactElement {
  return (
    <Section style={tripDayStyle}>
      <Row>
        <Column style={tripDayLabelCol}>
          <Text style={tripDayLabelStyle}>{tripDay.day}</Text>
          <Text style={tripDayDateStyle}>{tripDay.date}</Text>
        </Column>
        <Column>
          <Text style={tripDayParkStyle}>{tripDay.park}</Text>
          <Text style={tripDayLineStyle}><strong>Morning:</strong> {tripDay.morning}</Text>
          <Text style={tripDayLineStyle}><strong>Midday:</strong> {tripDay.midday}</Text>
          <Text style={tripDayLineStyle}><strong>Evening:</strong> {tripDay.evening}</Text>
          <Text style={tripDayCalloutStyle}><strong>Reason:</strong> {tripDay.callout}</Text>
        </Column>
      </Row>
    </Section>
  )
}

function SpendColumn({
  label,
  color,
  items,
}: {
  label: string
  color: string
  items: SpendItem[]
}): React.ReactElement {
  return (
    <Section style={spendColumnStyle}>
      <Text style={{ ...spendLabelStyle, backgroundColor: color }}>{label}</Text>
      {items.map((item, index) => (
        <Text key={index} style={spendItemStyle}>
          <strong>{item.label}</strong><br />
          {item.reason}
        </Text>
      ))}
    </Section>
  )
}

function TimelineRow({ item }: { item: TimelineItem }): React.ReactElement {
  return (
    <Row style={timelineRowStyle}>
      <Column style={timelineWhenCol}>
        <Text style={timelineWhenStyle}>{item.when}</Text>
      </Column>
      <Column>
        <Text style={timelineActionStyle}>{item.action}</Text>
      </Column>
    </Row>
  )
}

const colors = {
  cream: '#fff0d4',
  paper: '#ffffff',
  ink: '#101010',
  muted: '#5f5448',
  indigo: '#3327a8',
  red: '#ff4f3e',
  yellow: '#ffd43b',
  green: '#28b84a',
  teal: '#16b7c8',
  purple: '#8a53ff',
}

const toneColors: Record<CallTone, string> = {
  buy: colors.green,
  book: colors.purple,
  skip: colors.red,
  protect: colors.teal,
  watch: colors.yellow,
}

const fontFamily = '"Trebuchet MS", "Segoe UI", Arial, sans-serif'

const bodyStyle = {
  backgroundColor: colors.cream,
  fontFamily,
  margin: '0',
  padding: '0',
}

const containerStyle = {
  maxWidth: '640px',
  margin: '0 auto',
  padding: '22px',
}

const brandTopStyle = {
  textAlign: 'center' as const,
  padding: '4px 0 18px',
}

const castleBadgeStyle = {
  color: colors.ink,
  backgroundColor: colors.yellow,
  border: `3px solid ${colors.ink}`,
  borderRadius: '999px',
  display: 'inline-block',
  fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
  fontSize: '30px',
  lineHeight: '58px',
  margin: '0 auto 10px',
  textAlign: 'center' as const,
  width: '58px',
  height: '58px',
}

const brandLineStyle = {
  color: colors.indigo,
  fontSize: '12px',
  fontWeight: '900' as const,
  letterSpacing: '1.3px',
  lineHeight: '1.3',
  margin: '0',
  textTransform: 'uppercase' as const,
}

const heroStyle = {
  backgroundColor: colors.yellow,
  border: `3px solid ${colors.ink}`,
  borderRadius: '14px 14px 0 0',
  padding: '22px',
}

const eyebrowStyle = {
  color: colors.ink,
  fontSize: '12px',
  fontWeight: '800' as const,
  letterSpacing: '1.2px',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}

const titleStyle = {
  color: colors.ink,
  fontSize: '34px',
  fontWeight: '900' as const,
  lineHeight: '1.04',
  margin: '0 0 10px',
}

const ledeStyle = {
  color: '#2f2923',
  fontSize: '16px',
  lineHeight: '1.45',
  margin: '0',
}

const ticketStyle = {
  backgroundColor: colors.paper,
  borderRight: `3px solid ${colors.ink}`,
  borderBottom: `3px solid ${colors.ink}`,
  borderLeft: `3px solid ${colors.ink}`,
  borderRadius: '0 0 14px 14px',
  padding: '16px 20px',
  marginBottom: '18px',
}

const ticketColumn = {
  width: '50%',
  verticalAlign: 'top' as const,
  paddingRight: '12px',
}

const ticketLabel = {
  color: colors.indigo,
  fontSize: '11px',
  fontWeight: '800' as const,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
}

const ticketValue = {
  color: colors.ink,
  fontSize: '16px',
  fontWeight: '800' as const,
  lineHeight: '1.35',
  margin: '0 0 12px',
}

const sectionTitle = {
  color: colors.ink,
  fontSize: '22px',
  fontWeight: '900' as const,
  lineHeight: '1.1',
  margin: '22px 0 10px',
}

const methodColumn = {
  width: '33.3%',
  paddingRight: '6px',
  verticalAlign: 'top' as const,
}

const methodStyle = {
  backgroundColor: colors.paper,
  border: `2px solid ${colors.ink}`,
  borderRadius: '10px',
  padding: '12px',
}

const methodNumberStyle = {
  color: colors.ink,
  backgroundColor: colors.teal,
  border: `2px solid ${colors.ink}`,
  borderRadius: '999px',
  display: 'inline-block',
  fontSize: '13px',
  fontWeight: '900' as const,
  lineHeight: '26px',
  margin: '0 0 8px',
  textAlign: 'center' as const,
  width: '26px',
  height: '26px',
}

const methodTitleStyle = {
  color: colors.ink,
  fontSize: '16px',
  fontWeight: '900' as const,
  lineHeight: '1.2',
  margin: '0 0 6px',
}

const methodBodyStyle = {
  color: colors.muted,
  fontSize: '13px',
  lineHeight: '1.45',
  margin: '0',
}

const callStyle = {
  backgroundColor: colors.paper,
  border: `2px solid ${colors.ink}`,
  borderRadius: '12px',
  padding: '14px',
  marginBottom: '10px',
}

const callNumberCol = {
  width: '46px',
  verticalAlign: 'top' as const,
}

const callNumberStyle = {
  color: colors.ink,
  border: `2px solid ${colors.ink}`,
  borderRadius: '999px',
  display: 'inline-block',
  fontSize: '18px',
  fontWeight: '900' as const,
  lineHeight: '32px',
  margin: '0',
  textAlign: 'center' as const,
  width: '32px',
  height: '32px',
}

const callLabelStyle = {
  fontSize: '11px',
  fontWeight: '900' as const,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '0 0 2px',
}

const callTitleStyle = {
  color: colors.ink,
  fontSize: '19px',
  fontWeight: '900' as const,
  lineHeight: '1.2',
  margin: '0 0 6px',
}

const callDecisionStyle = {
  color: colors.ink,
  fontSize: '16px',
  fontWeight: '800' as const,
  lineHeight: '1.42',
  margin: '0 0 6px',
}

const callWhyStyle = {
  color: colors.muted,
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const paperSection = {
  backgroundColor: '#fffaf0',
  border: `2px dashed ${colors.ink}`,
  borderRadius: '12px',
  padding: '0 14px 14px',
  marginTop: '18px',
}

const tipCardStyle = {
  backgroundColor: colors.paper,
  border: `2px solid ${colors.ink}`,
  borderRadius: '10px',
  padding: '12px',
  marginBottom: '10px',
}

const tipSourceStyle = {
  color: colors.indigo,
  fontSize: '11px',
  fontWeight: '900' as const,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '0 0 6px',
}

const tipTextStyle = {
  color: colors.ink,
  fontSize: '16px',
  fontWeight: '800' as const,
  lineHeight: '1.4',
  margin: '0 0 6px',
}

const tipApplyStyle = {
  color: colors.muted,
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const tripDayStyle = {
  backgroundColor: colors.paper,
  border: `2px solid ${colors.ink}`,
  borderRadius: '12px',
  padding: '14px',
  marginBottom: '10px',
}

const tripDayLabelCol = {
  width: '92px',
  verticalAlign: 'top' as const,
  paddingRight: '12px',
}

const tripDayLabelStyle = {
  color: colors.paper,
  backgroundColor: colors.indigo,
  border: `2px solid ${colors.ink}`,
  borderRadius: '999px',
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: '900' as const,
  letterSpacing: '0.8px',
  textTransform: 'uppercase' as const,
  padding: '5px 8px',
  margin: '0 0 8px',
}

const tripDayDateStyle = {
  color: colors.muted,
  fontSize: '12px',
  fontWeight: '800' as const,
  lineHeight: '1.35',
  margin: '0',
}

const tripDayParkStyle = {
  color: colors.ink,
  fontSize: '18px',
  fontWeight: '900' as const,
  lineHeight: '1.2',
  margin: '0 0 8px',
}

const tripDayLineStyle = {
  color: colors.ink,
  fontSize: '14px',
  lineHeight: '1.45',
  margin: '0 0 6px',
}

const tripDayCalloutStyle = {
  color: colors.ink,
  backgroundColor: '#fff0d4',
  border: `1px solid ${colors.ink}`,
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: '800' as const,
  lineHeight: '1.4',
  margin: '8px 0 0',
  padding: '8px 10px',
}

const thirdColumn = {
  width: '33.3%',
  paddingRight: '6px',
  verticalAlign: 'top' as const,
}

const spendColumnStyle = {
  backgroundColor: colors.paper,
  border: `2px solid ${colors.ink}`,
  borderRadius: '10px',
  padding: '10px',
}

const spendLabelStyle = {
  color: colors.ink,
  border: `2px solid ${colors.ink}`,
  borderRadius: '999px',
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: '900' as const,
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  padding: '4px 8px',
  margin: '0 0 10px',
}

const spendItemStyle = {
  color: colors.muted,
  fontSize: '13px',
  lineHeight: '1.42',
  margin: '0 0 10px',
}

const timelineRowStyle = {
  borderTop: `1px solid ${colors.ink}`,
}

const timelineWhenCol = {
  width: '86px',
  verticalAlign: 'top' as const,
}

const timelineWhenStyle = {
  color: colors.indigo,
  fontSize: '13px',
  fontWeight: '900' as const,
  margin: '10px 0',
}

const timelineActionStyle = {
  color: colors.ink,
  fontSize: '14px',
  fontWeight: '800' as const,
  lineHeight: '1.45',
  margin: '10px 0',
}

const backupStyle = {
  backgroundColor: colors.indigo,
  border: `2px solid ${colors.ink}`,
  borderRadius: '12px',
  padding: '16px',
  marginTop: '18px',
}

const labelOnDark = {
  color: colors.yellow,
  fontSize: '11px',
  fontWeight: '900' as const,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}

const backupText = {
  color: colors.paper,
  fontSize: '16px',
  fontWeight: '800' as const,
  lineHeight: '1.45',
  margin: '0',
}

const replyStyle = {
  backgroundColor: colors.teal,
  border: `2px solid ${colors.ink}`,
  borderRadius: '12px',
  padding: '16px',
  marginTop: '14px',
}

const replyTitle = {
  color: colors.ink,
  fontSize: '16px',
  fontWeight: '900' as const,
  margin: '0 0 6px',
}

const replyText = {
  color: colors.ink,
  fontSize: '14px',
  fontWeight: '800' as const,
  lineHeight: '1.45',
  margin: '0',
}

const dividerStyle = {
  borderColor: colors.ink,
  margin: '22px 0 12px',
}

const footerStyle = {
  color: colors.muted,
  fontSize: '12px',
  lineHeight: '1.4',
  textAlign: 'center' as const,
  margin: '0 0 18px',
}
