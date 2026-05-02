import React, { useEffect } from 'react';
import { VStack } from '@chakra-ui/react';

import { ANALYTICS_EVENT } from '../../components/analytics';
import { useAnalytics } from '../../components/analytics/useAnalytics';
import { WithLayout } from '../../components/Layout';
import { Link } from '../../components/Link';
import { Text } from '../../components/Text';

export default WithLayout(() => {
	const analytics = useAnalytics();
	useEffect(() => {
		analytics.track(ANALYTICS_EVENT.PAGE_404);
	}, [analytics]);

	return (
		<VStack minHeight="60vh" justifyContent="center" gap="3rem">
			<VStack gap="0" textAlign="center">
				<Text
					as="h2"
					variant="description"
					fontWeight="500"
					fontSize="20px"
					margin={0}
				>
					404 - Page Not Found
				</Text>
				<Text fontSize="42px">You found an unresolved link.</Text>
			</VStack>

			<Text variant="description" fontSize="22px" textAlign="center">
				Our system have logged the missing page.
				<br />
				If something seems broken{' '}
				<Link href="mailto:contact@deepink.app" variant="native">
					let us know
				</Link>
				.
			</Text>

			<Link href="/" fontWeight={500} fontSize="20px">
				Back to the home page.
			</Link>
		</VStack>
	);
});
