import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FaApple, FaLinux, FaWindows } from 'react-icons/fa6';
import { SiFlatpak, SiHomebrew } from 'react-icons/si';
import { Code, Heading, Separator, VStack } from '@chakra-ui/react';

import { ANALYTICS_EVENT } from '../../components/analytics';
import { useAnalytics } from '../../components/analytics/useAnalytics';
import { WithLayout } from '../../components/Layout';
import { Link, LinkContext } from '../../components/Link';
import { Text } from '../../components/Text';
import { TheRock } from '../../components/TheRock';

import { PlatformDownloads } from './PlatformDownloads';
import { SimpleCodeBlock } from './SimpleCodeBlock';

const getPlatform = () => {
	let os: 'Windows' | 'macOS' | 'Linux' = 'Windows';

	if (typeof window !== 'undefined') {
		if (navigator.appVersion.includes('Mac')) {
			os = 'macOS';
		} else if (
			navigator.appVersion.includes('Linux') ||
			navigator.appVersion.includes('X11')
		) {
			os = 'Linux';
		}
	}

	return os;
};

const script = `(function(){
  var s = document.currentScript.previousElementSibling;
  var p = navigator.platform;
  var v = navigator.appVersion;
  s.textContent =
    /iPad|iPhone|iPod/.test(p) || (p === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'iOS' :
    /Android/.test(v) ? 'Android' :
    v.includes('Mac') ? 'macOS' :
    v.includes('Linux') || v.includes('X11') ? 'Linux' :
    'Windows';
})();`;

export const PlatformName = () => {
	return (
		<>
			<span>{getPlatform()}</span>
			<script dangerouslySetInnerHTML={{ __html: script }} />
		</>
	);
};

export default WithLayout(function Page({
	versions,
}: {
	versions: {
		url: string;
		name: string;
		publishedAt: string | null;
		prerelease: boolean;
		assets: {
			name: string;
			url: string;
		}[];
	}[];
}) {
	const analytics = useAnalytics();

	const {
		t,
		i18n: { language },
	} = useTranslation('downloads');

	const { links, linkMap } = useMemo(() => {
		const msi = versions[0].assets.find((version) =>
			version.name.endsWith('.msi'),
		)?.url;
		const mac = versions[0].assets.find((version) =>
			version.name.endsWith('.dmg'),
		)?.url;

		const appImage = versions[0].assets.find((version) =>
			version.name.endsWith('.AppImage'),
		)?.url;
		const deb = versions[0].assets.find((version) =>
			version.name.endsWith('.deb'),
		)?.url;
		const rpm = versions[0].assets.find((version) =>
			version.name.endsWith('.rpm'),
		)?.url;

		const links: Record<
			string,
			{
				title: string;
				url: string;
			}[]
		> = {
			windows: [],
			linux: [],
			mac: [],
		};

		if (msi) links.windows = [{ title: t('windows.installer'), url: msi }];
		if (mac) links.mac = [{ title: t('mac.package'), url: mac }];
		if (appImage || deb || rpm)
			links.linux = [
				appImage ? { title: t('linux.appImage'), url: appImage } : undefined,
				deb ? { title: t('linux.debPackage'), url: deb } : undefined,
				rpm ? { title: 'Rpm', url: rpm } : undefined,
			].filter((i) => i !== undefined);

		const linkMap = {
			Windows: msi,
			macOS: mac,
			Linux: appImage || deb || rpm,
		};

		return {
			links,
			linkMap,
		};
	}, [t, versions]);

	const [downloadLink, setDownloadLink] = useState(linkMap.Windows);
	useEffect(() => {
		const url = linkMap[getPlatform()];

		if (url) setDownloadLink(url);
	}, [linkMap]);

	const lastReleaseDate = useMemo(() => {
		const date = versions[0].publishedAt;
		if (!date) return null;

		return new Intl.DateTimeFormat(language, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}).format(new Date(date));
	}, [language, versions]);

	return (
		<LinkContext value="internal">
			<VStack paddingBlock="8rem" justifyContent="center" gap="3rem">
				<VStack gap="3rem">
					<TheRock maxW="100%" width="250px" />

					<VStack gap="1rem">
						<Link
							variant="button-primary"
							href={downloadLink}
							onClick={analytics.callback(
								ANALYTICS_EVENT.DOWNLOAD_BUTTON_CLICK,
								{
									context: 'Download page: Download Button',
									fileName: downloadLink
										? downloadLink.split('/').at(-1)
										: undefined,
								},
							)}
						>
							<Trans
								t={t}
								i18nKey="main.download"
								components={[<PlatformName key={0} />]}
							/>
						</Link>
						{lastReleaseDate && (
							<Text
								variant="description"
								fontFamily="monospace"
								suppressHydrationWarning
							>
								{t('main.releaseDate', {
									date: lastReleaseDate,
									version: versions[0].name,
								})}
							</Text>
						)}
					</VStack>
				</VStack>

				<VStack width="100%" gap="5rem" fontSize="1.6rem">
					<Text fontSize="1.2rem">{t('intro')}</Text>

					<VStack
						maxWidth="100%"
						gap="4rem"
						separator={<Separator width="100%" />}
					>
						{links.windows.length > 0 && (
							<PlatformDownloads
								platform="Windows"
								icon={<FaWindows />}
								links={links.windows}
							/>
						)}

						{links.mac.length > 0 && (
							<PlatformDownloads
								platform="macOS"
								icon={<FaApple />}
								links={links.mac}
								content={
									<VStack fontSize="1rem" align="start" gap="1rem">
										<Heading margin={0}>
											<SiHomebrew /> Homebrew
										</Heading>
										<Text whiteSpace="pre-line">
											<Trans
												t={t}
												i18nKey="mac.homebrew.description"
												components={{
													brew: (
														<Link href="https://brew.sh/" />
													),
													'cmd-update': (
														<Code>brew update</Code>
													),
													tap: (
														<Link href="https://docs.brew.sh/Taps">
															Homebrew Tap
														</Link>
													),
												}}
											/>
										</Text>
										<SimpleCodeBlock code="brew install deepinkapp/tap/deepink" />
									</VStack>
								}
							/>
						)}

						{links.linux.length > 0 && (
							<PlatformDownloads
								platform="Linux"
								icon={<FaLinux />}
								links={links.linux}
								content={
									<VStack fontSize="1rem" align="start">
										<Heading margin={0}>
											<SiFlatpak /> Flatpak
										</Heading>
										<Text whiteSpace="pre-line">
											<Trans
												t={t}
												i18nKey="linux.flatpak.addRepo"
												components={{
													flatpak: (
														<Link href="https://flatpak.org/" />
													),
													'cmd-update': (
														<Code>flatpak update</Code>
													),
												}}
											/>
										</Text>
										<SimpleCodeBlock code="flatpak remote-add --user --if-not-exists deepink https://deepink.app/flatpakrepo" />
										<Text whiteSpace="pre-line">
											{t('linux.flatpak.install')}
										</Text>
										<SimpleCodeBlock code="flatpak install app.deepink.Deepink" />
									</VStack>
								}
							/>
						)}
					</VStack>
				</VStack>
			</VStack>
		</LinkContext>
	);
});
