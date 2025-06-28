import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const SEOHead = ({ page = 'home' }) => {
  const { t } = useTranslation();

  return (
    <Helmet>
      <title>{t(`meta.${page}.title`)}</title>
      <meta name="description" content={t(`meta.${page}.description`)} />
      <meta property="og:title" content={t(`meta.${page}.title`)} />
      <meta property="og:description" content={t(`meta.${page}.description`)} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t(`meta.${page}.title`)} />
      <meta name="twitter:description" content={t(`meta.${page}.description`)} />
    </Helmet>
  );
};

export default SEOHead;