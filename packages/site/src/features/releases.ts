/* eslint-disable camelcase */

import { Octokit } from '@octokit/rest';

export const getReleases = async (token?: string) => {
	const octokit = new Octokit({ auth: token });
	const releases = await octokit.repos.listReleases({
		owner: 'DeepinkApp',
		repo: 'deepink',
	});

	return releases.data.map((release) => {
		const { prerelease, tag_name, html_url, published_at, assets } = release;
		const versionSegments = /^v?(.+)/.exec(tag_name);

		return {
			url: html_url,
			name: versionSegments ? versionSegments[1] : tag_name,
			publishedAt: published_at,
			prerelease,
			assets: assets.map(({ name, browser_download_url }) => ({
				name,
				url: browser_download_url,
			})),
		};
	});
};
