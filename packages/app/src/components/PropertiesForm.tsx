import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { DefaultValues, Path, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { isEqual } from 'lodash';
import { LOCALE_NAMESPACE } from 'src/i18n';
import z from 'zod';
import { Box, Button, HStack, Input, StackProps, Text, VStack } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';

export type OptionObject = {
	id: string;
	value: string;
	label: string;
	placeholder?: string;
	error?: string;
	suggests?: string[];
};

type SchemaFromOptions<T extends OptionObject[]> = z.ZodObject<
	Record<T[number]['value'], z.ZodString>
>;

// Change FormValues to represent INPUT (what the form fields hold)
type FormValues<T extends OptionObject[]> = z.input<SchemaFromOptions<T>>;

// Add a separate type for OUTPUT (what the resolver returns after parsing)
type FormOutput<T extends OptionObject[]> = z.output<SchemaFromOptions<T>>;

export type PropertiesFormProps<T extends OptionObject[]> = StackProps & {
	options: T;
	validatorScheme?: SchemaFromOptions<T>;
	onUpdate: (values: Record<T[number]['value'], string>) => void;
	onCancel?: () => void;
	submitButtonText?: string;
	cancelButtonText?: string;
	isPending?: boolean;
};

export const PropertiesForm = <T extends OptionObject[]>({
	options,
	validatorScheme,
	onUpdate,
	onCancel,
	submitButtonText,
	cancelButtonText,
	isPending,
	...props
}: PropertiesFormProps<T>) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.common);

	if (!submitButtonText) submitButtonText = t('actions.saveChanges');
	if (!cancelButtonText) cancelButtonText = t('actions.cancel');

	const optionsValues = useMemo(
		() =>
			Object.fromEntries(
				options.map(({ id, value }) => [id, value]),
				// Cast to DefaultValues<FormValues<T>> — safe because we know
				// all keys are strings matching the schema shape
			) as DefaultValues<FormValues<T>>,
		[options],
	);

	const {
		register,
		getValues,
		setFocus,
		setValue,
		reset,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues<T>, unknown, FormOutput<T>>({
		defaultValues: optionsValues,
		resolver: validatorScheme ? zodResolver(validatorScheme) : undefined,
	});

	useEffect(() => {
		if (isPending) return;
		if (isEqual(optionsValues, getValues())) return;

		reset(optionsValues);
	}, [getValues, isPending, optionsValues, reset, setValue]);

	return (
		<VStack gap="1.5rem" w="100%" minW="350px" {...props} asChild>
			<form
				onSubmit={handleSubmit((values: FormOutput<T>) => {
					onUpdate(values as Record<T[number]['value'], string>);
				})}
			>
				<VStack align="start" w="100%" gap="1rem">
					{options.map(({ id, label, placeholder, error, suggests }) => {
						const fieldErrors = errors as Record<
							string,
							{ message?: string } | undefined
						>;
						const errorMessage = error || fieldErrors[id]?.message;

						return (
							<VStack key={id} align="start" w="100%" gap="0" asChild>
								<label>
									<Text marginBottom="0.5rem">{label}</Text>
									<Input
										{...register(
											// Cast id to Path<FormValues<T>> — safe because options are always derived from the same schema shape
											id as Path<FormValues<T>>,
										)}
										placeholder={placeholder}
										disabled={isPending}
									/>
									{suggests && suggests.length > 0 && (
										<Box marginTop="0.6rem">
											<Trans
												t={t}
												i18nKey="form.suggestTemplate"
												components={{
													suggests: (
														<>
															{suggests.map(
																(suggest, i) => (
																	<React.Fragment
																		key={i}
																	>
																		{i > 0 && ', '}
																		<Button
																			variant="link"
																			onClick={(
																				evt,
																			) => {
																				evt.preventDefault();
																				setValue(
																					id as Path<
																						FormValues<T>
																					>,
																					suggest as any,
																				);
																				setFocus(
																					id as Path<
																						FormValues<T>
																					>,
																				);
																			}}
																		>
																			{suggest}
																		</Button>
																	</React.Fragment>
																),
															)}
														</>
													),
												}}
											/>
										</Box>
									)}
									{errorMessage && (
										<Text color="message.error">{errorMessage}</Text>
									)}
								</label>
							</VStack>
						);
					})}
				</VStack>
				<HStack w="100%" justifyContent="end">
					<Button variant="accent" type="submit" disabled={isPending}>
						{submitButtonText}
					</Button>
					{onCancel && (
						<Button onClick={onCancel} disabled={isPending}>
							{cancelButtonText}
						</Button>
					)}
				</HStack>
			</form>
		</VStack>
	);
};
