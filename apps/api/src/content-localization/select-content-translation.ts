import { ContentLocale } from '@prisma/client';

export interface LocalizedTranslation {
  locale: ContentLocale;
}

export function selectContentTranslation<
  Translation extends LocalizedTranslation,
>(
  translations: readonly Translation[],
  requestedLocale: ContentLocale,
): Translation {
  const selectedTranslation =
    translations.find(
      (translation) => translation.locale === requestedLocale,
    ) ??
    translations.find((translation) => translation.locale === ContentLocale.en);
  if (!selectedTranslation) {
    throw new Error(
      'Localized content is missing its required English fallback',
    );
  }
  return selectedTranslation;
}

export function requestedContentLocales(
  requestedLocale: ContentLocale,
): ContentLocale[] {
  return requestedLocale === ContentLocale.en
    ? [ContentLocale.en]
    : [ContentLocale.uk, ContentLocale.en];
}
