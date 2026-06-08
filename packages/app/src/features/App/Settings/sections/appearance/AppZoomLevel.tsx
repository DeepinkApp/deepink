import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import z from 'zod';
import { Button, HStack, Input, InputGroup, Text, VStack } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { getDefaultZoomFactor, getZoomFactor, setZoomFactor } from '@utils/os/zoom';

const zoomLimits = {
	min: 30,
	max: 500,
};

const zoomFactorToPercents = (factor: number) => Math.round(factor * 100);

export const AppZoomLevel = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);

	const zoomScheme = useMemo(
		() =>
			z.object({
				zoom: z
					.string()
					.trim()
					.min(1, { message: t('appearance.zoomLevel.errors.enterNumber') })
					.transform((v) => Number(v))
					.pipe(
						z
							.number()
							.min(
								zoomLimits.min,
								t('appearance.zoomLevel.errors.tooSmall', {
									min: zoomLimits.min,
								}),
							)
							.max(
								zoomLimits.max,
								t('appearance.zoomLevel.errors.tooBig', {
									max: zoomLimits.max,
								}),
							)
							.transform((v) => Number((v / 100).toFixed(3))),
					),
			}),
		[t],
	);

	const form = useForm({
		delayError: 500,
		defaultValues: {
			zoom: String(zoomFactorToPercents(getZoomFactor())),
		},
		resolver: zodResolver(zoomScheme),
		shouldFocusError: true,
		reValidateMode: 'onChange',
	});

	return (
		<VStack align="start" asChild>
			<form
				noValidate
				onSubmit={form.handleSubmit(async ({ zoom }) => {
					setZoomFactor(zoom);
				})}
			>
				<HStack align="start">
					<InputGroup
						width="auto"
						endElement={
							<Text variant="secondary" pointerEvents="none">
								%
							</Text>
						}
					>
						<Input
							size="sm"
							width="6rem"
							textAlign="right"
							type="number"
							step={10}
							min={zoomLimits.min}
							max={zoomLimits.max}
							{...form.register('zoom')}
						/>
					</InputGroup>
					<Button size="sm" type="submit">
						{t('appearance.zoomLevel.apply')}
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							const defaultZoom = getDefaultZoomFactor();

							setZoomFactor(defaultZoom);
							form.reset({
								zoom: String(zoomFactorToPercents(defaultZoom)),
							});
						}}
					>
						{t('appearance.zoomLevel.reset')}
					</Button>
				</HStack>
				{Object.entries(form.formState.errors).map(([id, error]) => {
					return (
						<Text key={id} color="message.error" fontSize="sm">
							{error.message}
						</Text>
					);
				})}
			</form>
		</VStack>
	);
};
