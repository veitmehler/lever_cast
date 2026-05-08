'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Eye, EyeOff, Save, Check, Loader2, Sparkles, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'
import { toast } from 'sonner'

// ISO 3166-1 alpha-2 country list used for the address country dropdown.
// Value = ISO code (stored in DB); label = full country name (shown in address string).
const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' }, { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' }, { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' }, { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' }, { code: 'BT', name: 'Bhutan' },
  { code: 'BO', name: 'Bolivia' }, { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' }, { code: 'BR', name: 'Brazil' },
  { code: 'BN', name: 'Brunei' }, { code: 'BG', name: 'Bulgaria' },
  { code: 'BF', name: 'Burkina Faso' }, { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde' }, { code: 'KH', name: 'Cambodia' },
  { code: 'CM', name: 'Cameroon' }, { code: 'CA', name: 'Canada' },
  { code: 'CF', name: 'Central African Republic' }, { code: 'TD', name: 'Chad' },
  { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' }, { code: 'KM', name: 'Comoros' },
  { code: 'CG', name: 'Congo' }, { code: 'CR', name: 'Costa Rica' },
  { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' },
  { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' }, { code: 'DJ', name: 'Djibouti' },
  { code: 'DM', name: 'Dominica' }, { code: 'DO', name: 'Dominican Republic' },
  { code: 'EC', name: 'Ecuador' }, { code: 'EG', name: 'Egypt' },
  { code: 'SV', name: 'El Salvador' }, { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' }, { code: 'EE', name: 'Estonia' },
  { code: 'SZ', name: 'Eswatini' }, { code: 'ET', name: 'Ethiopia' },
  { code: 'FJ', name: 'Fiji' }, { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' }, { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' }, { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' }, { code: 'GD', name: 'Grenada' },
  { code: 'GT', name: 'Guatemala' }, { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' }, { code: 'HN', name: 'Honduras' },
  { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' },
  { code: 'KI', name: 'Kiribati' }, { code: 'KW', name: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Latvia' }, { code: 'LB', name: 'Lebanon' },
  { code: 'LS', name: 'Lesotho' }, { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' }, { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' },
  { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' },
  { code: 'MY', name: 'Malaysia' }, { code: 'MV', name: 'Maldives' },
  { code: 'ML', name: 'Mali' }, { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Islands' }, { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' }, { code: 'MX', name: 'Mexico' },
  { code: 'FM', name: 'Micronesia' }, { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' }, { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' }, { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' }, { code: 'MM', name: 'Myanmar' },
  { code: 'NA', name: 'Namibia' }, { code: 'NR', name: 'Nauru' },
  { code: 'NP', name: 'Nepal' }, { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'NI', name: 'Nicaragua' },
  { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' }, { code: 'PW', name: 'Palau' },
  { code: 'PA', name: 'Panama' }, { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' }, { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' },
  { code: 'RW', name: 'Rwanda' }, { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'LC', name: 'Saint Lucia' }, { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  { code: 'WS', name: 'Samoa' }, { code: 'SM', name: 'San Marino' },
  { code: 'ST', name: 'São Tomé and Príncipe' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SN', name: 'Senegal' }, { code: 'RS', name: 'Serbia' },
  { code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' },
  { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' }, { code: 'SB', name: 'Solomon Islands' },
  { code: 'SO', name: 'Somalia' }, { code: 'ZA', name: 'South Africa' },
  { code: 'SS', name: 'South Sudan' }, { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' }, { code: 'SD', name: 'Sudan' },
  { code: 'SR', name: 'Suriname' }, { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' }, { code: 'SY', name: 'Syria' },
  { code: 'TW', name: 'Taiwan' }, { code: 'TJ', name: 'Tajikistan' },
  { code: 'TZ', name: 'Tanzania' }, { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste' }, { code: 'TG', name: 'Togo' },
  { code: 'TO', name: 'Tonga' }, { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' }, { code: 'TV', name: 'Tuvalu' },
  { code: 'UG', name: 'Uganda' }, { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' }, { code: 'VU', name: 'Vanuatu' },
  { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' },
  { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
] as const

type ApiKeyData = {
  id: string
  provider: string
  maskedKey: string
  createdAt: string
  updatedAt: string
}

type SocialConnection = {
  id: string
  platform: string
  appType: 'personal' | 'company' | null // For LinkedIn: distinguishes between Personal Profile and Company Pages apps
  platformUserId: string | null
  platformUsername: string | null
  postTargetType: 'personal' | 'page' | null
  selectedPageId: string | null
  isActive: boolean
  lastUsed: string | null
  createdAt: string
  updatedAt: string
}

type SocialPage = {
  id: string
  name: string
  vanityName?: string
  access_token?: string
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [isSaving, setIsSaving] = useState(false)
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState<Record<string, boolean>>({})
  const [isConnecting, setIsConnecting] = useState<Record<string, boolean>>({})
  const [availablePages, setAvailablePages] = useState<Record<string, SocialPage[]>>({})
  const [isLoadingPages, setIsLoadingPages] = useState<Record<string, boolean>>({})
  const [rateLimitUntil, setRateLimitUntil] = useState<Record<string, number | null>>({})
  const [postTargetTypes, setPostTargetTypes] = useState<Record<string, 'personal' | 'page'>>({})
  const pagesFetchedRef = useRef<Set<string>>(new Set())
  const [selectedPageIds, setSelectedPageIds] = useState<Record<string, string>>({})
  const [isRefreshingUsername, setIsRefreshingUsername] = useState<Record<string, boolean>>({})

  // Writing style settings
  const [writingStyle, setWritingStyle] = useState('')
  const [isSavingWritingStyle, setIsSavingWritingStyle] = useState(false)
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false)
  const [showStyleAnalysisModal, setShowStyleAnalysisModal] = useState(false)
  const [sampleText, setSampleText] = useState('')

  // Telegram bot token (per-user, stays in ApiKey table)
  const [telegramBotToken, setTelegramBotToken] = useState('')
  const [telegramMaskedKey, setTelegramMaskedKey] = useState('')
  const [isEditingTelegram, setIsEditingTelegram] = useState(false)
  const [showTelegramKey, setShowTelegramKey] = useState(false)

  // Telegram channel settings
  const [telegramChatId, setTelegramChatId] = useState('')
  const [isSavingTelegramChatId, setIsSavingTelegramChatId] = useState(false)

  // Article Brand Profile — content fields
  const [geolocation, setGeolocation]                   = useState('')
  const [who, setWho]                                   = useState('')
  const [ourExperience, setOurExperience]               = useState('')
  const [articleGoal, setArticleGoal]                   = useState('')
  const [brandSpecialInstructions, setBrandSpecialInst] = useState('')
  const [defaultAuthorName, setDefaultAuthorName]       = useState('')
  const [defaultAuthorWebsite, setDefaultAuthorWebsite] = useState('')
  const [defaultAuthorLinkedIn, setDefaultAuthorLinkedIn] = useState('')

  // Article Brand Profile — organization / schema markup fields
  const [organizationName, setOrganizationName]         = useState('')
  const [organizationWebsite, setOrganizationWebsite]   = useState('')
  const [organizationEmail, setOrganizationEmail]       = useState('')
  const [organizationPhone, setOrganizationPhone]       = useState('')
  // Structured address sub-fields
  const [addressLine1, setAddressLine1]                 = useState('')
  const [addressLine2, setAddressLine2]                 = useState('')
  const [addressLocality, setAddressLocality]           = useState('') // city
  const [addressRegion, setAddressRegion]               = useState('') // state / province
  const [postalCode, setPostalCode]                     = useState('')
  const [addressCountryName, setAddressCountryName]     = useState('') // full name
  const [organizationCountryCode, setOrganizationCountryCode] = useState('') // ISO, auto-set from dropdown
  // Legacy combined string — only used to show a migration hint when structured fields are empty
  const [legacyAddress, setLegacyAddress]               = useState('')
  const [googleBusinessProfileUrl, setGoogleBusinessProfileUrl] = useState('')
  const [socialMediaLinks, setSocialMediaLinks]         = useState<Array<{ platform: string; url: string }>>([])

  const [diagramPrimaryColor, setDiagramPrimaryColor]       = useState('')
  const [diagramSecondaryColor, setDiagramSecondaryColor]   = useState('')
  const [diagramLineColor, setDiagramLineColor]             = useState('')
  const [diagramFontFamily, setDiagramFontFamily]           = useState('')
  const [isSavingDiagramStyle, setIsSavingDiagramStyle]     = useState(false)

  const [articleFontFamily, setArticleFontFamily] = useState('')
  const [articleFontWeight, setArticleFontWeight] = useState('400')
  const [articleFontSizeBase, setArticleFontSizeBase] = useState('16px')
  const [isSavingArticleFonts, setIsSavingArticleFonts] = useState(false)

  const [isSavingBrand, setIsSavingBrand]               = useState(false)

  // Fetch settings and Telegram key on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, keysRes, brandRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/api-keys'),
          fetch('/api/brand-settings'),
        ])

        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          if (settings.writingStyle) setWritingStyle(settings.writingStyle)
          if (settings.telegramChatId) setTelegramChatId(settings.telegramChatId)
        }

        if (keysRes.ok) {
          const keys: ApiKeyData[] = await keysRes.json()
          const telegramRow = keys.find((k) => k.provider === 'telegram')
          if (telegramRow) setTelegramMaskedKey(telegramRow.maskedKey)
        }

        if (brandRes.ok) {
          const brand = await brandRes.json()
          if (brand.geolocation)          setGeolocation(brand.geolocation)
          if (brand.who)                  setWho(brand.who)
          if (brand.ourExperience)        setOurExperience(brand.ourExperience)
          if (brand.articleGoal)          setArticleGoal(brand.articleGoal)
          if (brand.specialInstructions)  setBrandSpecialInst(brand.specialInstructions)
          if (brand.defaultAuthorName)    setDefaultAuthorName(brand.defaultAuthorName)
          if (brand.defaultAuthorWebsite) setDefaultAuthorWebsite(brand.defaultAuthorWebsite)
          if (brand.defaultAuthorLinkedIn) setDefaultAuthorLinkedIn(brand.defaultAuthorLinkedIn)
          // Organization fields
          if (brand.organizationName)    setOrganizationName(brand.organizationName)
          if (brand.organizationWebsite) setOrganizationWebsite(brand.organizationWebsite)
          if (brand.organizationEmail)   setOrganizationEmail(brand.organizationEmail)
          if (brand.organizationPhone)   setOrganizationPhone(brand.organizationPhone)
          // Structured address sub-fields
          if (brand.addressLine1)       setAddressLine1(brand.addressLine1)
          if (brand.addressLine2)       setAddressLine2(brand.addressLine2)
          if (brand.addressLocality)    setAddressLocality(brand.addressLocality)
          if (brand.addressRegion)      setAddressRegion(brand.addressRegion)
          if (brand.postalCode)         setPostalCode(brand.postalCode)
          if (brand.addressCountryName) setAddressCountryName(brand.addressCountryName)
          if (brand.organizationCountryCode) setOrganizationCountryCode(brand.organizationCountryCode)
          // Store legacy combined string so we can show a migration hint
          if (brand.organizationAddress && !brand.addressLine1) setLegacyAddress(brand.organizationAddress)
          if (brand.googleBusinessProfileUrl) setGoogleBusinessProfileUrl(brand.googleBusinessProfileUrl)
          if (Array.isArray(brand.socialMediaLinks)) setSocialMediaLinks(brand.socialMediaLinks)
          setDiagramPrimaryColor(brand.diagramPrimaryColor ?? '')
          setDiagramSecondaryColor(brand.diagramSecondaryColor ?? '')
          setDiagramLineColor(brand.diagramLineColor ?? '')
          setDiagramFontFamily(brand.diagramFontFamily ?? '')
          setArticleFontFamily(brand.articleFontFamily ?? '')
          setArticleFontWeight(brand.articleFontWeight ?? '400')
          setArticleFontSizeBase(brand.articleFontSizeBase ?? '16px')
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }

    fetchSettings()
  }, [])

  const handleSaveWritingStyle = async () => {
    try {
      setIsSavingWritingStyle(true)
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writingStyle: writingStyle || null,
        }),
      })

      if (response.ok) {
        toast.success('Writing style saved successfully')
      } else {
        const error = await response.json()
        console.error('Failed to save writing style:', error)
        toast.error(error.details || error.error || 'Failed to save writing style')
      }
    } catch (error) {
      console.error('Error saving writing style:', error)
      toast.error('Failed to save writing style')
    } finally {
      setIsSavingWritingStyle(false)
    }
  }

  const handleAnalyzeWritingStyle = async () => {
    if (!sampleText.trim() || sampleText.trim().split(/\s+/).length < 500) {
      toast.error('Please paste at least 500 words of sample text')
      return
    }

    try {
      setIsAnalyzingStyle(true)
      const response = await fetch('/api/ai/analyze-writing-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sampleText: sampleText.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setWritingStyle(data.writingStyle || '')
        setShowStyleAnalysisModal(false)
        setSampleText('')
        toast.success('Writing style analyzed and applied successfully')
      } else {
        const error = await response.json()
        console.error('Failed to analyze writing style:', error)
        toast.error(error.details || error.error || 'Failed to analyze writing style')
      }
    } catch (error) {
      console.error('Error analyzing writing style:', error)
      toast.error('Failed to analyze writing style')
    } finally {
      setIsAnalyzingStyle(false)
    }
  }

  // Track loading state with ref to avoid dependency issues
  const isLoadingPagesRef = useRef<Set<string>>(new Set())
  // Store pages in ref so we can access latest value without dependency issues
  const availablePagesRef = useRef<Record<string, SocialPage[]>>({})
  // Track rate limit cooldowns (platform -> timestamp when we can retry)
  const rateLimitCooldownRef = useRef<Record<string, number>>({})
  
  // Update ref whenever state changes
  useEffect(() => {
    availablePagesRef.current = availablePages
  }, [availablePages])
  
  // Fetch pages for a platform
  // Using useCallback with empty deps and refs to break dependency cycle
  const fetchPages = useCallback(async (platform: string, forceRefresh = false): Promise<SocialPage[]> => {
    if (platform !== 'linkedin' && platform !== 'facebook') return []
    
    // Prevent duplicate calls: if already loading (unless force refresh)
    if (!forceRefresh && isLoadingPagesRef.current.has(platform)) {
      // Return current pages from ref (always up-to-date)
      return availablePagesRef.current[platform] || []
    }
    
    // Check rate limit cooldown
    const cooldownEnd = rateLimitCooldownRef.current[platform]
    if (!forceRefresh && cooldownEnd && Date.now() < cooldownEnd) {
      console.log(`[Settings] Rate limit cooldown active for ${platform}, skipping fetch`)
      return availablePagesRef.current[platform] || []
    }
    
    // Only skip if already fetched AND we have pages (not if fetch failed)
    if (!forceRefresh && pagesFetchedRef.current.has(platform)) {
      const cachedPages = availablePagesRef.current[platform] || []
      // If we have cached pages, return them
      if (cachedPages.length > 0) {
        return cachedPages
      }
      // If cached pages are empty but not due to rate limit, allow retry
      // (Rate limit cooldown check above will prevent immediate retry)
    }
    
    try {
      isLoadingPagesRef.current.add(platform)
      setIsLoadingPages(prev => ({ ...prev, [platform]: true }))
      const response = await fetch(`/api/social/${platform}/pages`)
      if (response.ok) {
        const data = await response.json() as { pages: SocialPage[]; rateLimit?: boolean }
        const pages = data.pages || []
        
        // If rate limit, set cooldown (5 minutes)
        if (data.rateLimit) {
          console.warn(`[Settings] Rate limit detected for ${platform}, setting 5-minute cooldown`)
          const cooldownEndTime = Date.now() + 5 * 60 * 1000 // 5 minutes
          rateLimitCooldownRef.current[platform] = cooldownEndTime
          setRateLimitUntil(prev => ({ ...prev, [platform]: cooldownEndTime }))
          // Still mark as fetched to prevent immediate retries
          pagesFetchedRef.current.add(platform)
        } else {
          // Clear cooldown if we got a successful response
          delete rateLimitCooldownRef.current[platform]
          setRateLimitUntil(prev => {
            if (!prev[platform]) return prev
            const updated = { ...prev }
            delete updated[platform]
            return updated
          })
          // Mark as fetched if API call succeeded (even if pages array is empty)
          pagesFetchedRef.current.add(platform)
        }
        
        setAvailablePages(prev => ({ ...prev, [platform]: pages }))
        // Update ref immediately
        availablePagesRef.current[platform] = pages
        return pages
      } else {
        let errorData: { error?: string; rateLimit?: boolean; retryAfterMs?: number } | null = null
        try {
          errorData = await response.json()
        } catch {
          errorData = null
        }

        const isRateLimitError = response.status === 429 || errorData?.rateLimit
        const retryAfterMs = errorData?.retryAfterMs || 5 * 60 * 1000

        if (isRateLimitError) {
          console.warn(`[Settings] ${platform} pages rate limited. Pausing new requests for ${(retryAfterMs / 60000).toFixed(1)} minutes.`)
          const cooldownEndTime = Date.now() + retryAfterMs
          rateLimitCooldownRef.current[platform] = cooldownEndTime
          setRateLimitUntil(prev => ({ ...prev, [platform]: cooldownEndTime }))
          pagesFetchedRef.current.add(platform) // Prevent immediate retries
          toast.warning('Facebook API rate limit reached. Please wait a few minutes before trying again.', {
            duration: 12000,
          })
        } else {
          // Ensure cooldown cleared so future retries are allowed
          delete rateLimitCooldownRef.current[platform]
          setRateLimitUntil(prev => {
            if (!prev[platform]) return prev
            const updated = { ...prev }
            delete updated[platform]
            return updated
          })
          pagesFetchedRef.current.delete(platform)
          const errorMessage = errorData?.error || `Failed to fetch ${platform} pages (${response.status})`
          toast.error(errorMessage)
        }

        setAvailablePages(prev => ({ ...prev, [platform]: [] }))
        availablePagesRef.current[platform] = []
        return []
      }
    } catch (error) {
      console.error(`Error fetching ${platform} pages:`, error)
      setAvailablePages(prev => ({ ...prev, [platform]: [] }))
      availablePagesRef.current[platform] = []
      delete rateLimitCooldownRef.current[platform]
      setRateLimitUntil(prev => {
        if (!prev[platform]) return prev
        const updated = { ...prev }
        delete updated[platform]
        return updated
      })
      // Don't mark as fetched if there was an error, so we can retry
      pagesFetchedRef.current.delete(platform)
      return []
    } finally {
      isLoadingPagesRef.current.delete(platform)
      setIsLoadingPages(prev => ({ ...prev, [platform]: false }))
    }
  }, []) // Empty deps - use refs to access latest state without causing re-renders

  // Update post target settings
  const updatePostTargetSettings = async (platform: string, postTargetType: 'personal' | 'page', selectedPageId?: string) => {
    try {
      const response = await fetch(`/api/social/${platform}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postTargetType,
          selectedPageId: postTargetType === 'page' ? selectedPageId : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state
        setSocialConnections(prev => prev.map(c => 
          c.platform === platform && c.isActive
            ? { ...c, postTargetType: data.connection.postTargetType, selectedPageId: data.connection.selectedPageId }
            : c
        ))
        toast.success(`${platform === 'linkedin' ? 'LinkedIn' : 'Facebook'} posting target updated`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error(`Error updating ${platform} settings:`, error)
      toast.error('Failed to update settings')
    }
  }

  // Fetch social connections on mount
  // Using useCallback with fetchPages as dependency since we call it inside
  const fetchConnections = useCallback(async () => {
    try {
      setIsLoadingConnections(true)
      const response = await fetch('/api/social/connections')
      if (response.ok) {
        const connections: SocialConnection[] = await response.json()
        setSocialConnections(connections)
        
        // Initialize postTargetTypes and selectedPageIds from connections
        const targetTypes: Record<string, 'personal' | 'page'> = {}
        const pageIds: Record<string, string> = {}
        connections.forEach(conn => {
          if (conn.isActive && (conn.platform === 'linkedin' || conn.platform === 'facebook')) {
            targetTypes[conn.platform] = conn.postTargetType || 'personal'
            if (conn.selectedPageId) {
              pageIds[conn.platform] = conn.selectedPageId
            }
            // Fetch pages if connected - fetchPages has internal guards to prevent duplicates
            if (conn.platform === 'linkedin' || conn.platform === 'facebook') {
              // Call fetchPages directly - it's stable (empty deps) and has internal deduplication
              fetchPages(conn.platform, false).catch(err => {
                console.error(`Error fetching pages for ${conn.platform}:`, err)
              })
            }
          }
        })
        setPostTargetTypes(targetTypes)
        setSelectedPageIds(pageIds)
      }
    } catch (error) {
      console.error('Error fetching social connections:', error)
    } finally {
      setIsLoadingConnections(false)
    }
  }, [fetchPages]) // fetchPages is stable (empty deps), so this is safe

  // Check for OAuth callback messages in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected === 'true') {
      toast.success('Account connected successfully!')
      // Refresh connections list
      fetchConnections()
      // Clean up URL
      window.history.replaceState({}, '', '/settings')
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        'oauth_not_configured': 'OAuth not configured. Please check environment variables.',
        'invalid_state': 'Invalid OAuth state. Please try again.',
        'token_exchange_failed': 'Failed to exchange authorization code. Please try again.',
        'profile_fetch_failed': 'Failed to fetch profile. Please try again.',
        'unauthorized_scope_error': 'LinkedIn app needs "Share on LinkedIn" product approval. See instructions below.',
        'w_organization_social_not_approved': 'LinkedIn Company Pages are not available. You can still connect and post to your personal profile.',
        'rate_limit': 'Twitter rate limit reached. Please wait 15 minutes before trying again.',
        'no_instagram_account': 'No Instagram Business account found linked to your Facebook Page. Please ensure your Instagram account is a Business or Creator account and is linked to your Facebook Page in Business Manager.',
        'instagram_permission_required': 'Instagram connection requires App Review. The app needs "instagram_content_publish" permission approved through Meta App Review. Please complete App Review in your Meta App Dashboard before connecting Instagram.',
        'page_token_missing': 'Failed to get Page access token. Please try reconnecting.',
      }
      
      // Check if error message contains rate limit indicators
      const decodedError = decodeURIComponent(error)
      const isRateLimit = decodedError.toLowerCase().includes('rate') || 
                         decodedError.toLowerCase().includes('429') ||
                         decodedError.toLowerCase().includes('too many requests')
      
      // Get custom message from URL if available
      const messageParam = searchParams.get('message')
      const customMessage = messageParam ? decodeURIComponent(messageParam) : null
      
      const errorMsg = customMessage || (isRateLimit 
        ? 'Twitter rate limit reached. Please wait 15 minutes before trying to connect again.'
        : errorMessages[error] || `Connection failed: ${decodedError}`)
      
      // Show warning for w_organization_social (not a blocking error)
      if (error === 'w_organization_social_not_approved') {
        toast.warning(errorMsg, {
          duration: 10000,
        })
      } else {
        toast.error(errorMsg, {
          duration: 15000, // Show longer for important errors
        })
      }
      
      // Show detailed message for scope errors
      if (error === 'unauthorized_scope_error') {
        console.error('LinkedIn Scope Error:', 'Your LinkedIn app needs to request access to "Share on LinkedIn" product.')
        console.error('Steps:')
        console.error('1. Go to https://www.linkedin.com/developers/')
        console.error('2. Select your app')
        console.error('3. Go to "Products" tab')
        console.error('4. Request access to "Share on LinkedIn"')
        console.error('5. Wait for approval (can take a few days)')
      }
      
      // Clean up URL
      window.history.replaceState({}, '', '/settings')
    }
  }, [fetchConnections])

  // Fetch social connections on mount
  useEffect(() => {
    fetchConnections()
  }, [fetchConnections]) // fetchConnections is stable (memoized with useCallback), so it won't change

  const handleSaveBrandProfile = async () => {
    setIsSavingBrand(true)
    try {
      const res = await fetch('/api/brand-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geolocation: geolocation || null,
          who: who || null,
          ourExperience: ourExperience || null,
          articleGoal: articleGoal || null,
          specialInstructions: brandSpecialInstructions || null,
          defaultAuthorName: defaultAuthorName || null,
          defaultAuthorWebsite: defaultAuthorWebsite || null,
          defaultAuthorLinkedIn: defaultAuthorLinkedIn.trim() || null,
          organizationName: organizationName || null,
          organizationWebsite: organizationWebsite || null,
          organizationEmail: organizationEmail || null,
          organizationPhone: organizationPhone || null,
          addressLine1: addressLine1.trim() || null,
          addressLine2: addressLine2.trim() || null,
          addressLocality: addressLocality.trim() || null,
          addressRegion: addressRegion.trim() || null,
          postalCode: postalCode.trim() || null,
          addressCountryName: addressCountryName.trim() || null,
          organizationCountryCode: organizationCountryCode || null,
          googleBusinessProfileUrl: googleBusinessProfileUrl.trim() || null,
          socialMediaLinks: socialMediaLinks.filter((l) => l.platform && l.url),
          diagramPrimaryColor: diagramPrimaryColor.trim() || null,
          diagramSecondaryColor: diagramSecondaryColor.trim() || null,
          diagramLineColor: diagramLineColor.trim() || null,
          diagramFontFamily: diagramFontFamily.trim() || null,
        }),
      })
      if (res.ok) {
        toast.success('Brand profile saved')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? 'Failed to save brand profile')
      }
    } catch {
      toast.error('Failed to save brand profile')
    } finally {
      setIsSavingBrand(false)
    }
  }

  const handleSaveDiagramStyle = async () => {
    setIsSavingDiagramStyle(true)
    try {
      const res = await fetch('/api/brand-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagramPrimaryColor: diagramPrimaryColor.trim() || null,
          diagramSecondaryColor: diagramSecondaryColor.trim() || null,
          diagramLineColor: diagramLineColor.trim() || null,
          diagramFontFamily: diagramFontFamily.trim() || null,
        }),
      })
      if (res.ok) {
        toast.success('Diagram style saved')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? 'Failed to save diagram style')
      }
    } catch {
      toast.error('Failed to save diagram style')
    } finally {
      setIsSavingDiagramStyle(false)
    }
  }

  const handleSaveArticleTypography = async () => {
    setIsSavingArticleFonts(true)
    try {
      const res = await fetch('/api/brand-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleFontFamily: articleFontFamily.trim() || null,
          articleFontWeight: articleFontWeight.trim() || null,
          articleFontSizeBase: articleFontSizeBase.trim() || null,
        }),
      })
      if (res.ok) {
        toast.success('Article typography saved')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? 'Failed to save article typography')
      }
    } catch {
      toast.error('Failed to save article typography')
    } finally {
      setIsSavingArticleFonts(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences, API keys, and connected accounts
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Theme
              </label>
              <div className="flex gap-3">
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex-1 rounded-lg p-4 text-left transition-all ${
                    theme === 'dark' 
                      ? 'border-2 border-primary bg-secondary' 
                      : 'border border-border bg-muted hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-foreground">Dark Mode</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {theme === 'dark' ? 'Current theme' : 'Click to activate'}
                  </div>
                </button>
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex-1 rounded-lg p-4 text-left transition-all ${
                    theme === 'light' 
                      ? 'border-2 border-primary bg-secondary' 
                      : 'border border-border bg-muted hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-foreground">Light Mode</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {theme === 'light' ? 'Current theme' : 'Click to activate'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Writing Style Settings */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Writing Style</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Define your writing voice and style. This will be used to guide AI-generated posts to match your preferred tone and style.
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Writing Style Description
              </label>
              <textarea
                value={writingStyle}
                onChange={(e) => setWritingStyle(e.target.value)}
                placeholder="e.g., Professional yet conversational, uses short sentences, includes data-driven insights, friendly and approachable tone..."
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Describe your writing style, tone, and voice preferences. This will be included in AI prompts to ensure generated content matches your style.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowStyleAnalysisModal(true)}
                variant="outline"
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Sample Text
              </Button>
              <Button
                onClick={handleSaveWritingStyle}
                disabled={isSavingWritingStyle}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSavingWritingStyle ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Writing Style
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Writing Style Analysis Modal */}
        {showStyleAnalysisModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-card-foreground">Analyze Writing Style</h3>
                <button
                  onClick={() => {
                    setShowStyleAnalysisModal(false)
                    setSampleText('')
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Paste at least 500 words of your existing writing (blog posts, articles, social media posts, etc.). 
                Our AI will analyze the text and generate a writing style description for you.
              </p>
              
              <div className="mb-4">
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Sample Text (Minimum 500 words)
                </label>
                <textarea
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value)}
                  placeholder="Paste your writing sample here..."
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[300px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Word count: {sampleText.trim().split(/\s+/).filter(w => w.length > 0).length} / 500 minimum
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowStyleAnalysisModal(false)
                    setSampleText('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAnalyzeWritingStyle}
                  disabled={isAnalyzingStyle || sampleText.trim().split(/\s+/).filter(w => w.length > 0).length < 500}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isAnalyzingStyle ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze & Apply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Article Brand Profile */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">Article Brand Profile</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Context about you and your business that the AI uses when writing long-form articles.
            These fields are <strong>not</strong> used for social posts — only article generation.
            Leave any field blank and the AI will work in general terms for that aspect.
          </p>

          <div className="space-y-5">
            {/* Geographic focus */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Geographic focus
              </label>
              <input
                type="text"
                value={geolocation}
                onChange={(e) => setGeolocation(e.target.value)}
                placeholder='e.g. "United States", "Sydney, Australia", or "Global"'
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground mt-1">Used to constrain facts and statistics to your market.</p>
            </div>

            {/* About you / your business */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                About you / your business
              </label>
              <textarea
                value={who}
                onChange={(e) => setWho(e.target.value)}
                placeholder="Who are you? What do you do? Who do you serve? Write in your own voice."
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
            </div>

            {/* Relevant experience */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Your relevant experience
              </label>
              <textarea
                value={ourExperience}
                onChange={(e) => setOurExperience(e.target.value)}
                placeholder="Years in the field, types of work, areas of expertise. Concrete details only — no fluff."
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">Grounds the article&apos;s authority claims in real experience.</p>
            </div>

            {/* Article goal */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Goal of your articles
              </label>
              <textarea
                value={articleGoal}
                onChange={(e) => setArticleGoal(e.target.value)}
                placeholder="What outcome do you want each article to drive? E.g. newsletter sign-ups, leads, brand authority, education."
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">Steers tone and calls-to-action across all articles.</p>
            </div>

            {/* Special instructions */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Standing instructions for every article
              </label>
              <textarea
                value={brandSpecialInstructions}
                onChange={(e) => setBrandSpecialInst(e.target.value)}
                placeholder="Rules that apply to every article: e.g., always use Oxford commas, never mention competitors by name, write at 8th-grade reading level."
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">Different from per-article special instructions — these apply globally.</p>
            </div>

            {/* Author info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Default author name
                </label>
                <input
                  type="text"
                  value={defaultAuthorName}
                  onChange={(e) => setDefaultAuthorName(e.target.value)}
                  placeholder="e.g. Dr. Jane Smith, PhD, PT"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground mt-1">Include all professional credentials (e.g. Dr., PhD, MD, RN). Appears as the article byline and in schema markup.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Default author website
                </label>
                <input
                  type="url"
                  value={defaultAuthorWebsite}
                  onChange={(e) => setDefaultAuthorWebsite(e.target.value)}
                  placeholder="https://example.com/about"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground mt-1">Used in schema markup alongside the organization details below.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Author LinkedIn
              </label>
              <input
                type="url"
                value={defaultAuthorLinkedIn}
                onChange={(e) => setDefaultAuthorLinkedIn(e.target.value)}
                placeholder="https://linkedin.com/in/jane-smith"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground mt-1">Used in schema markup and included in the final article review.</p>
            </div>

            {/* Organization / Schema Markup sub-section */}
            <div className="pt-2">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">Organization &amp; Schema Markup</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Used to generate JSON-LD structured data injected into every published article.
                    These details appear in search engines as publisher information.
                  </p>
                </div>

                {/* Name + Website */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-card-foreground mb-1">
                      Organization name
                    </label>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Acme Legal Group"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-card-foreground mb-1">
                      Organization website
                    </label>
                    <input
                      type="url"
                      value={organizationWebsite}
                      onChange={(e) => setOrganizationWebsite(e.target.value)}
                      placeholder="https://acmelegal.com"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Email + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-card-foreground mb-1">
                      Contact email
                    </label>
                    <input
                      type="email"
                      value={organizationEmail}
                      onChange={(e) => setOrganizationEmail(e.target.value)}
                      placeholder="hello@acmelegal.com"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-card-foreground mb-1">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={organizationPhone}
                      onChange={(e) => setOrganizationPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Structured address */}
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-card-foreground">
                    Business address
                  </label>
                  {/* Migration hint: show old combined string if sub-fields are empty */}
                  {legacyAddress && !addressLine1 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md px-3 py-2">
                      Previously saved: &quot;{legacyAddress}&quot; — please re-enter using the fields below to save in the new structured format.
                    </p>
                  )}
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Street address"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Suite, unit, building (optional)"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={addressLocality}
                      onChange={(e) => setAddressLocality(e.target.value)}
                      placeholder="City"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="text"
                      value={addressRegion}
                      onChange={(e) => setAddressRegion(e.target.value)}
                      placeholder="State / Province"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="ZIP / Postal code"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div>
                      <select
                        value={organizationCountryCode}
                        onChange={(e) => {
                          setOrganizationCountryCode(e.target.value)
                          const opt = e.target.options[e.target.selectedIndex]
                          setAddressCountryName(opt.text === 'Select country…' ? '' : opt.text)
                        }}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select country…</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Google Business Profile */}
                <div>
                  <label className="block text-xs font-medium text-card-foreground mb-1">
                    Google Business Profile URL
                  </label>
                  <input
                    type="url"
                    value={googleBusinessProfileUrl}
                    onChange={(e) => setGoogleBusinessProfileUrl(e.target.value)}
                    placeholder="https://g.page/your-business"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Used as publisher location in schema markup.</p>
                </div>

                {/* Social media links */}
                <div>
                  <label className="block text-xs font-medium text-card-foreground mb-2">
                    Social media profiles
                  </label>
                  <div className="space-y-2">
                    {socialMediaLinks.map((link, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={link.platform}
                          onChange={(e) => {
                            const next = [...socialMediaLinks]
                            next[idx] = { ...next[idx], platform: e.target.value }
                            setSocialMediaLinks(next)
                          }}
                          placeholder="Platform (e.g. LinkedIn)"
                          className="w-36 shrink-0 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => {
                            const next = [...socialMediaLinks]
                            next[idx] = { ...next[idx], url: e.target.value }
                            setSocialMediaLinks(next)
                          }}
                          placeholder="https://linkedin.com/company/acmelegal"
                          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => setSocialMediaLinks(socialMediaLinks.filter((_, i) => i !== idx))}
                          className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Remove link"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSocialMediaLinks([...socialMediaLinks, { platform: '', url: '' }])}
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add social profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSaveBrandProfile}
                disabled={isSavingBrand}
              >
                {isSavingBrand
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                  : <><Save className="w-4 h-4 mr-2" />Save Brand Profile</>}
              </Button>
            </div>
          </div>
        </div>

        {/* Mermaid diagram styling (article enrichment) */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">Diagram style</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Node and line colors for Mermaid diagrams during article enrichment; label text contrast is chosen
            automatically by the renderer. Leave blank to use built-in defaults (blue / violet / gray).
            Secondary color is also used as the tertiary accent for a two-tone look.
          </p>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Primary (node fill)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={diagramPrimaryColor || '#3B82F6'}
                    onChange={(e) => setDiagramPrimaryColor(e.target.value.toUpperCase())}
                    className="h-10 w-14 cursor-pointer rounded border border-input bg-background p-1"
                    aria-label="Primary diagram color"
                  />
                  <input
                    type="text"
                    value={diagramPrimaryColor}
                    onChange={(e) => setDiagramPrimaryColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Secondary (accent)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={diagramSecondaryColor || '#8B5CF6'}
                    onChange={(e) => setDiagramSecondaryColor(e.target.value.toUpperCase())}
                    className="h-10 w-14 cursor-pointer rounded border border-input bg-background p-1"
                    aria-label="Secondary diagram color"
                  />
                  <input
                    type="text"
                    value={diagramSecondaryColor}
                    onChange={(e) => setDiagramSecondaryColor(e.target.value)}
                    placeholder="#8B5CF6"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Connector lines</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={diagramLineColor || '#6B7280'}
                    onChange={(e) => setDiagramLineColor(e.target.value.toUpperCase())}
                    className="h-10 w-14 cursor-pointer rounded border border-input bg-background p-1"
                    aria-label="Line color"
                  />
                  <input
                    type="text"
                    value={diagramLineColor}
                    onChange={(e) => setDiagramLineColor(e.target.value)}
                    placeholder="#6B7280"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Font family</label>
              <select
                value={diagramFontFamily}
                onChange={(e) => setDiagramFontFamily(e.target.value)}
                className="w-full max-w-lg rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Server default</option>
                <option value="Arial, Helvetica, sans-serif">Arial, Helvetica, sans-serif</option>
                <option value="Georgia, serif">Georgia, serif</option>
                <option value="Inter, sans-serif">Inter, sans-serif</option>
                <option value="Roboto, sans-serif">Roboto, sans-serif</option>
                <option value="Open Sans, sans-serif">&quot;Open Sans&quot;, sans-serif</option>
                <option value="Lato, sans-serif">Lato, sans-serif</option>
                <option value="Source Sans 3, sans-serif">&quot;Source Sans 3&quot;, sans-serif</option>
                <option value="Nunito, sans-serif">Nunito, sans-serif</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Choose &quot;Server default&quot; to use the built-in font.
              </p>
            </div>
            <Button onClick={handleSaveDiagramStyle} disabled={isSavingDiagramStyle}>
              {isSavingDiagramStyle ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save diagram style
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Standalone HTML article typography */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">Article typography (HTML export)</h2>
          <p className="text-sm text-muted-foreground mb-6">
            These settings apply to the downloadable standalone <code className="text-xs bg-muted px-1 rounded">article.html</code> export only.
            WordPress publishes use your theme&apos;s typography.
          </p>
          <div className="space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Font family</label>
              <input
                type="text"
                value={articleFontFamily}
                onChange={(e) => setArticleFontFamily(e.target.value)}
                placeholder='e.g. "Inter", system-ui, sans-serif'
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Quick picks:{' '}
                <button type="button" className="underline text-primary" onClick={() => setArticleFontFamily('Georgia, serif')}>
                  Georgia
                </button>
                {' · '}
                <button type="button" className="underline text-primary" onClick={() => setArticleFontFamily('Inter, sans-serif')}>
                  Inter
                </button>
                {' · '}
                <button type="button" className="underline text-primary" onClick={() => setArticleFontFamily('Merriweather, serif')}>
                  Merriweather
                </button>
                {' · '}
                <button type="button" className="underline text-primary" onClick={() => setArticleFontFamily('Roboto, sans-serif')}>
                  Roboto
                </button>
                {' · '}
                <button type="button" className="underline text-primary" onClick={() => setArticleFontFamily('"Open Sans", sans-serif')}>
                  Open Sans
                </button>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Font weight (body)</label>
              <select
                value={articleFontWeight}
                onChange={(e) => setArticleFontWeight(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="400">400 — Normal</option>
                <option value="500">500 — Medium</option>
                <option value="600">600 — Semi-bold</option>
                <option value="700">700 — Bold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Base font size</label>
              <input
                type="text"
                value={articleFontSizeBase}
                onChange={(e) => setArticleFontSizeBase(e.target.value)}
                placeholder="16px"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Use a CSS length (e.g. 16px, 1rem, 112.5%).</p>
            </div>
            <Button onClick={() => void handleSaveArticleTypography()} disabled={isSavingArticleFonts}>
              {isSavingArticleFonts ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save article typography
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Connected Accounts</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your social media accounts to publish directly from Socioply
          </p>
          
          {isLoadingConnections ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {['linkedin', 'twitter', 'facebook', 'instagram', 'threads'].map((platform) => {
                // For LinkedIn, check for both personal and company connections
                // For other platforms, find the single connection
                let connection: typeof socialConnections[0] | undefined
                if (platform === 'linkedin') {
                  // Prefer company connection if available, otherwise personal
                  connection = socialConnections.find(c => 
                    c.platform === platform && 
                    c.isActive && 
                    (c.appType === 'company' || c.appType === 'personal')
                  )
                } else {
                  connection = socialConnections.find(c => c.platform === platform && c.isActive)
                }
                const isConnected = !!connection
                const isDisconnectingPlatform = isDisconnecting[platform] || false

                const handleConnect = async (target: 'personal' | 'company' = 'personal') => {
                  // For LinkedIn, create a unique key for personal vs company
                  const connectionKey = platform === 'linkedin' ? `${platform}-${target}` : platform
                  
                  // Prevent multiple rapid clicks
                  if (isConnecting[connectionKey] || isConnecting[platform]) {
                    return
                  }

                  try {
                    // Set connecting state for both the specific key and platform (for backward compatibility)
                    setIsConnecting(prev => ({ ...prev, [connectionKey]: true, [platform]: true }))
                    
                    // For LinkedIn, pass target parameter to select the correct app
                    const url = platform === 'linkedin' && target === 'company'
                      ? `/api/social/${platform}?target=company`
                      : `/api/social/${platform}`
                    const response = await fetch(url, {
                      method: 'POST',
                    })
                    const data = await response.json()
                    
                    if (response.ok) {
                      if (data.redirectUrl) {
                        // Redirect to OAuth URL
                        window.location.href = data.redirectUrl
                      } else {
                        toast.error('OAuth flow not configured. Please check server logs.')
                        setIsConnecting(prev => ({ ...prev, [connectionKey]: false, [platform]: false }))
                      }
                    } else {
                      // Show the actual error from the API
                      console.error(`OAuth error for ${platform}:`, data)
                      const errorMsg = data.error || `Failed to connect ${platform}. Please check that OAuth credentials are configured.`
                      
                      // Check for rate limit errors
                      if (errorMsg.toLowerCase().includes('rate') || errorMsg.toLowerCase().includes('429')) {
                        toast.error('Twitter rate limit reached. Please wait 15 minutes before trying again.', {
                          duration: 15000,
                        })
                      } else {
                        toast.error(errorMsg)
                      }
                      setIsConnecting(prev => ({ ...prev, [connectionKey]: false, [platform]: false }))
                    }
                  } catch (error) {
                    console.error('Error connecting platform:', error)
                    toast.error(`Failed to connect ${platform}. Check console for details.`)
                    setIsConnecting(prev => ({ ...prev, [connectionKey]: false, [platform]: false }))
                  }
                }

                const handleDisconnect = async () => {
                  if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
                    return
                  }

                  try {
                    setIsDisconnecting(prev => ({ ...prev, [platform]: true }))
                    const response = await fetch(`/api/social/${platform}`, {
                      method: 'DELETE',
                    })
                    if (response.ok) {
                      setSocialConnections(prev => prev.filter(c => !(c.platform === platform && c.isActive)))
                      toast.success(`${platform} disconnected successfully`)
                    } else {
                      const error = await response.json()
                      toast.error(error.error || 'Failed to disconnect')
                    }
                  } catch (error) {
                    console.error('Error disconnecting platform:', error)
                    toast.error('Failed to disconnect')
                  } finally {
                    setIsDisconnecting(prev => ({ ...prev, [platform]: false }))
                  }
                }

                const platformConfig = {
                  linkedin: { bg: '#0A66C2', icon: 'in', name: 'LinkedIn' },
                  twitter: { bg: '#1DA1F2', icon: '𝕏', name: 'Twitter / X' },
                  facebook: { bg: '#1877F2', icon: 'f', name: 'Facebook' },
                  instagram: { bg: '#E4405F', icon: '📷', name: 'Instagram' },
                  threads: { bg: '#000000', icon: '🧵', name: 'Threads' },
                  telegram: { bg: '#24A1DE', icon: '✈️', name: 'Telegram' },
                }[platform] ?? {
                  bg: '#6B7280',
                  icon: platform.slice(0, 1).toUpperCase(),
                  name: platform.charAt(0).toUpperCase() + platform.slice(1),
                }

                const showPageSelector = isConnected && (platform === 'linkedin' || platform === 'facebook')
                const currentPostTargetType = postTargetTypes[platform] || connection?.postTargetType || 'personal'
                const currentSelectedPageId = selectedPageIds[platform] || connection?.selectedPageId || ''
                const pages = availablePages[platform] || []
                const isLoadingPagesForPlatform = isLoadingPages[platform] || false
                const rateLimitEndTime = rateLimitUntil[platform] || null
                const rateLimitRemainingMs = rateLimitEndTime ? Math.max(rateLimitEndTime - Date.now(), 0) : 0
                const rateLimitActive = rateLimitRemainingMs > 0

                return (
                  <div key={platform} className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold`}
                          style={platform === 'instagram' || platform === 'threads'
                            ? { background: platform === 'instagram' 
                                ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                                : 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)' }
                            : { backgroundColor: platformConfig.bg }
                          }>
                          {platformConfig.icon}
                        </div>
                        <div>
                          <div className="font-medium text-card-foreground">
                            {platformConfig.name}
                          </div>
                          {isConnected ? (
                            <div className="text-xs text-primary">
                              Connected{connection?.platformUsername ? ` as ${connection.platformUsername}` : ''}
                              {connection?.lastUsed && (
                                <span className="text-muted-foreground ml-1">
                                  • Last used {new Date(connection.lastUsed).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Not connected</div>
                          )}
                        </div>
                      </div>
                      {platform === 'linkedin' && !isConnected ? (
                        // Show two buttons for LinkedIn: Personal Profile and Company Page
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleConnect('personal')}
                            disabled={isConnecting[`${platform}-personal`] || isConnecting[platform]}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {isConnecting[`${platform}-personal`] || isConnecting[platform] ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              'Personal Profile'
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConnect('company')}
                            disabled={isConnecting[`${platform}-company`] || isConnecting[platform]}
                          >
                            {isConnecting[`${platform}-company`] || isConnecting[platform] ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              'Company Page'
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {isConnected && platform === 'instagram' && (!connection?.platformUsername || connection?.platformUsername === 'Instagram User') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!connection?.id) return
                                
                                setIsRefreshingUsername(prev => ({ ...prev, [platform]: true }))
                                try {
                                  const response = await fetch('/api/social/instagram/refresh-username', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      connectionId: connection.id,
                                    }),
                                  })
                                  
                                  const data = await response.json()
                                  
                                  if (data.success && data.username) {
                                    toast.success(`Username updated to @${data.username}`)
                                    // Refresh connections to update UI
                                    await fetchConnections()
                                  } else {
                                    // Show warning instead of error - this is a known limitation
                                    toast.warning(data.error || 'Could not fetch username. It will be fetched automatically when you publish your first Instagram post.')
                                  }
                                } catch (error) {
                                  console.error('Error refreshing Instagram username:', error)
                                  toast.error('Failed to refresh username')
                                } finally {
                                  setIsRefreshingUsername(prev => ({ ...prev, [platform]: false }))
                                }
                              }}
                              disabled={isRefreshingUsername[platform]}
                              className="text-xs"
                            >
                              {isRefreshingUsername[platform] ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Refreshing...
                                </>
                              ) : (
                                'Refresh Username'
                              )}
                            </Button>
                          )}
                          <Button
                            variant={isConnected ? 'outline' : 'default'}
                            size="sm"
                            onClick={isConnected ? handleDisconnect : () => handleConnect()}
                            disabled={isDisconnectingPlatform || isConnecting[platform]}
                            className={isConnected ? '' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
                          >
                            {isDisconnectingPlatform ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Disconnecting...
                              </>
                            ) : isConnecting[platform] ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              isConnected ? 'Disconnect' : 'Connect'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Page/Profile Selector for LinkedIn and Facebook */}
                    {showPageSelector && (
                      <div className="ml-14 space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="text-sm font-medium text-card-foreground mb-2">Post Target</div>
                        <div className="flex gap-2 mb-2">
                          <Button
                            variant={currentPostTargetType === 'personal' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setPostTargetTypes(prev => ({ ...prev, [platform]: 'personal' }))
                              updatePostTargetSettings(platform, 'personal')
                            }}
                            className={currentPostTargetType === 'personal' ? 'bg-primary text-primary-foreground' : ''}
                          >
                            Personal Profile
                          </Button>
                          <Button
                            variant={currentPostTargetType === 'page' ? 'default' : 'outline'}
                            size="sm"
                            onClick={async () => {
                              setPostTargetTypes(prev => ({ ...prev, [platform]: 'page' }))
                              
                              // Fetch pages if not already loaded (force refresh if user explicitly clicks)
                              let pagesToUse = pages
                              if (!isLoadingPagesForPlatform && pages.length === 0) {
                                console.log(`[Settings] Fetching pages for ${platform}...`)
                                pagesToUse = await fetchPages(platform, true) // Force refresh when user clicks
                              }
                              
                              // Auto-select first page if pages are available and none selected
                              if (pagesToUse.length > 0) {
                                const pageIdToUse = currentSelectedPageId || pagesToUse[0].id
                                setSelectedPageIds(prev => ({ ...prev, [platform]: pageIdToUse }))
                                updatePostTargetSettings(platform, 'page', pageIdToUse)
                              } else {
                                // No pages found, just set target type
                                updatePostTargetSettings(platform, 'page')
                              }
                            }}
                            className={currentPostTargetType === 'page' ? 'bg-primary text-primary-foreground' : ''}
                          >
                            Business Page
                          </Button>
                        </div>
                        
                        {currentPostTargetType === 'page' && (
                          <div className="space-y-2">
                            {isLoadingPagesForPlatform ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading pages...
                              </div>
                            ) : pages.length === 0 ? (
                              <div className="text-sm text-muted-foreground space-y-2">
                                <div>No pages found.</div>
                                {platform === 'linkedin' ? (
                                  <div className="text-xs">
                                    LinkedIn Company Pages require the &quot;Community Management API&quot; product approval (MDP was deprecated April 2024). This requires a separate LinkedIn app. You can still post to your personal profile.
                                  </div>
                                ) : (
                                  <div className="text-xs space-y-1">
                                    <div>Make sure you have admin access to at least one Facebook Page.</div>
                                    {currentSelectedPageId && (
                                      <div className="text-card-foreground">
                                        Saved Page ID: <code>{currentSelectedPageId}</code> (stored in the database and still used for publishing).
                                      </div>
                                    )}
                                    {rateLimitActive && (
                                      <div className="text-amber-600">
                                        Facebook API rate limit is active. Retry in approximately {Math.max(1, Math.ceil(rateLimitRemainingMs / 60000))} minute(s), or click &quot;Retry page fetch&quot; below once it clears.
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isLoadingPagesForPlatform}
                                    onClick={async () => {
                                      await fetchPages(platform, true)
                                    }}
                                  >
                                    {isLoadingPagesForPlatform ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        Retrying...
                                      </>
                                    ) : (
                                      'Retry page fetch'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <select
                                value={currentSelectedPageId}
                                onChange={(e) => {
                                  const pageId = e.target.value
                                  setSelectedPageIds(prev => ({ ...prev, [platform]: pageId }))
                                  updatePostTargetSettings(platform, 'page', pageId)
                                }}
                                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Select a page...</option>
                                {pages.map((page) => (
                                  <option key={page.id} value={page.id}>
                                    {page.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              
              {/* Telegram - Uses API Key instead of OAuth */}
              {(() => {
                const hasTelegramKey = !!telegramMaskedKey
                const telegramInputValue = telegramBotToken
                const telegramDisplayValue = telegramInputValue || (hasTelegramKey && !isEditingTelegram ? telegramMaskedKey : '')
                
                const handleSaveTelegramKey = async () => {
                  const apiKey = telegramInputValue?.trim()
                  if (!apiKey) {
                    toast.error('Please enter a Telegram bot token')
                    return
                  }

                  try {
                    setIsSaving(true)
                    const response = await fetch('/api/api-keys', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ provider: 'telegram', apiKey }),
                    })

                    if (response.ok) {
                      const result: ApiKeyData = await response.json()
                      setTelegramMaskedKey(result.maskedKey)
                      setTelegramBotToken('')
                      setIsEditingTelegram(false)
                      toast.success('Telegram bot token saved successfully')
                    } else {
                      const error = await response.json()
                      toast.error(error.error || 'Failed to save Telegram bot token')
                    }
                  } catch (error) {
                    console.error('Error saving Telegram bot token:', error)
                    toast.error('Failed to save Telegram bot token')
                  } finally {
                    setIsSaving(false)
                  }
                }

                const handleRemoveTelegramKey = async () => {
                  if (!confirm('Are you sure you want to remove your Telegram bot token?')) {
                    return
                  }

                  try {
                    setIsDisconnecting(prev => ({ ...prev, telegram: true }))
                    const response = await fetch('/api/api-keys', {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ provider: 'telegram' }),
                    })
                    if (response.ok) {
                      setTelegramMaskedKey('')
                      toast.success('Telegram bot token removed successfully')
                    } else {
                      const error = await response.json()
                      toast.error(error.error || 'Failed to remove Telegram bot token')
                    }
                  } catch (error) {
                    console.error('Error removing Telegram bot token:', error)
                    toast.error('Failed to remove Telegram bot token')
                  } finally {
                    setIsDisconnecting(prev => ({ ...prev, telegram: false }))
                  }
                }

                return (
                  <div key="telegram" className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold bg-[#0088cc]">
                        📱
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-card-foreground mb-2">
                          Telegram
                        </div>
                        <div className="relative">
                          <input
                            type={showTelegramKey && (telegramInputValue || isEditingTelegram) ? 'text' : 'password'}
                            value={isEditingTelegram ? telegramInputValue : telegramDisplayValue}
                            onChange={(e) => {
                              setTelegramBotToken(e.target.value)
                              if (!isEditingTelegram && hasTelegramKey) {
                                setIsEditingTelegram(true)
                              }
                            }}
                            placeholder={hasTelegramKey && !isEditingTelegram ? telegramMaskedKey : 'Enter your Telegram bot token'}
                            className="w-full rounded-lg border border-input bg-background px-4 py-2 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                          />
                          {(telegramInputValue || isEditingTelegram) && (
                            <button
                              onClick={() => setShowTelegramKey((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showTelegramKey ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {hasTelegramKey && !isEditingTelegram && !telegramInputValue
                            ? 'Bot token saved'
                            : 'Get your bot token from @BotFather on Telegram'}
                        </p>
                        {hasTelegramKey && (
                          <div className="mt-3">
                            <label className="text-xs font-medium text-card-foreground mb-1 block">
                              Default Telegram Channel ID
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={telegramChatId}
                                onChange={(e) => setTelegramChatId(e.target.value)}
                                placeholder="@channelname or -1001234567890"
                                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isSavingTelegramChatId}
                                onClick={async () => {
                                  try {
                                    setIsSavingTelegramChatId(true)
                                    const response = await fetch('/api/settings', {
                                      method: 'PATCH',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        telegramChatId: telegramChatId || null,
                                      }),
                                    })
                                    if (response.ok) {
                                      toast.success('Telegram channel ID saved successfully')
                                    } else {
                                      const error = await response.json()
                                      toast.error(error.error || 'Failed to save Telegram channel ID')
                                    }
                                  } catch (error) {
                                    console.error('Error saving Telegram channel ID:', error)
                                    toast.error('Failed to save Telegram channel ID')
                                  } finally {
                                    setIsSavingTelegramChatId(false)
                                  }
                                }}
                                className="px-3"
                              >
                                {isSavingTelegramChatId ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Channel username (e.g., @mychannel) or numeric ID (e.g., -1001234567890). Your bot must be an admin of this channel.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {(telegramInputValue || isEditingTelegram) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!telegramInputValue || isSaving}
                          onClick={() => handleSaveTelegramKey()}
                          className="px-3"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      {hasTelegramKey && !isEditingTelegram && !telegramInputValue && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditingTelegram(true)
                              setTelegramBotToken('')
                            }}
                            className="px-3"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveTelegramKey}
                            disabled={isDisconnecting['telegram']}
                            className="px-3"
                          >
                            {isDisconnecting['telegram'] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Remove'
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

