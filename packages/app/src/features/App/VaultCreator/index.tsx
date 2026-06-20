import React, {
	FC,
	forwardRef,
	PropsWithChildren,
	ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { Trans, useTranslation } from 'react-i18next';
import { FaDice, FaShield, FaThumbsDown, FaThumbsUp } from 'react-icons/fa6';
import bytes from 'bytes';
import { LOCALE_NAMESPACE } from 'src/i18n';
import {
	Box,
	Button,
	CloseButton,
	Dialog,
	HStack,
	Input,
	InputGroup,
	InputProps,
	Link,
	NativeSelect,
	Portal,
	Progress,
	Switch,
	Text,
	useDisclosure,
	VStack,
} from '@chakra-ui/react';
import { IconButton } from '@components/IconButton';
import { RelaxedSlider } from '@components/Slider/RelaxedSlider';
import { ENCRYPTION_ALGORITHM } from '@core/features/encryption';
import { ENCRYPTION_ALGORITHM_OPTIONS } from '@core/features/encryption/algorithms';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { VaultEncryptionInitConfig } from '@core/storage/VaultEncryptionController';
import { useTelemetryTracker } from '@features/telemetry';
import { useRelaxedValue } from '@hooks/useRelaxedValue';
import { shuffleArray } from '@utils/collections/shuffleArray';
import { useDebouncedCallback } from '@utils/debounce/useDebouncedCallback';

import { VaultsForm } from '../VaultsForm';
import { calcEntropy } from './calculatePasswordEntropy';

export const PasswordInput = forwardRef<
	HTMLInputElement,
	Omit<InputProps, 'value'> & {
		value: string;
		setValue: (value: string) => void;
		invalid?: boolean;
		disabled?: boolean;
	}
>(({ value, setValue, ...props }, ref) => {
	const { t: tEncryption } = useTranslation(LOCALE_NAMESPACE.encryption);

	const [password, setPassword] = useRelaxedValue({ value, onChange: setValue });

	const [passwordScore, setPasswordScore] = useState<{
		entropy: number;
		strength: 'good' | 'bad';
	} | null>(null);

	const updatePasswordScore = useDebouncedCallback(
		() => {
			if (!password) {
				setPasswordScore(null);
				return;
			}

			const entropy = Math.round(calcEntropy(password).entropy);
			const strength: 'good' | 'bad' = entropy > 60 ? 'good' : 'bad';

			setPasswordScore({ entropy, strength });
		},
		{ wait: 300, runImmediateFirstCall: false },
	);

	useEffect(() => {
		if (!password) {
			updatePasswordScore.cancel();
			setPasswordScore(null);
			return;
		}

		updatePasswordScore();
	}, [password, updatePasswordScore]);

	return (
		<VStack w="100%" alignItems="start">
			<InputGroup
				endElement={
					passwordScore ? (
						passwordScore.strength === 'good' ? (
							<FaThumbsUp />
						) : (
							<FaThumbsDown />
						)
					) : undefined
				}
			>
				<Input
					ref={ref}
					type="password"
					value={password}
					onChange={(evt) => setPassword(evt.target.value)}
					{...props}
				/>
			</InputGroup>
			{passwordScore && (
				<VStack width="100%" align="start" paddingTop=".3rem">
					<Text variant="secondary" fontSize="1rem">
						{passwordScore.strength === 'good'
							? tEncryption('password.score.good', {
									length: password.length,
									entropy: passwordScore.entropy,
								})
							: tEncryption('password.score.bad', {
									length: password.length,
									entropy: passwordScore.entropy,
								})}
					</Text>
					<Progress.Root
						width="100%"
						value={passwordScore.entropy}
						max={80}
						size="xs"
						status={passwordScore.strength === 'good' ? 'success' : 'error'}
					>
						<Progress.Track>
							<Progress.Range />
						</Progress.Track>
					</Progress.Root>
				</VStack>
			)}
		</VStack>
	);
});

export const DetailsContainer = ({
	icon,
	title,
	children,
}: PropsWithChildren<{
	icon?: ReactNode;
	title?: ReactNode;
}>) => {
	const [isOpened, setIsOpened] = useState(false);

	return (
		<VStack
			width="100%"
			align="start"
			borderRadius="6px"
			padding="1rem"
			backgroundColor="surface.panel"
		>
			<Box
				display="inline-flex"
				gap=".5rem"
				textDecor="none"
				width="100%"
				color="typography.accent"
				alignItems="center"
				asChild
			>
				<label>
					{icon}
					{title && <span>{title}</span>}
					<Switch.Root
						marginLeft="auto"
						checked={isOpened}
						onCheckedChange={(event) => {
							setIsOpened(event.checked);
						}}
					>
						<Switch.HiddenInput />
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
					</Switch.Root>
				</label>
			</Box>
			<Box display={isOpened ? undefined : 'none'} width="100%" paddingBlock="1rem">
				{children}
			</Box>
		</VStack>
	);
};

export type NewVault = {
	name: string;
	encryption: VaultEncryptionInitConfig | null;
};

export type VaultCreatorProps = {
	onCreateVault: (vault: NewVault) => Promise<void | string>;
	onCancel?: () => void;
	defaultVaultName?: string;
};

export const VaultCreator: FC<VaultCreatorProps> = ({
	onCreateVault,
	onCancel,
	defaultVaultName,
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.vault);

	const telemetry = useTelemetryTracker();

	const vaultNameInputRef = useRef<HTMLInputElement | null>(null);
	const passwordInputRef = useRef<HTMLInputElement | null>(null);
	const isSubmittingRef = useRef(false);

	const [isPending, setIsPending] = useState(false);

	const [vaultName, setVaultName] = useState(defaultVaultName ?? '');
	const [vaultNameError, setVaultNameError] = useState<null | string>(null);
	useEffect(() => {
		setVaultNameError(null);
	}, [vaultName]);

	const [password, setPassword] = useState('');
	const [passwordError, setPasswordError] = useState<null | string>(null);

	const [algorithm, setAlgorithm] = useState(ENCRYPTION_ALGORITHM_OPTIONS[0]);
	const [argonOps, setArgonOps] = useState(2);
	const [argonMemory, setArgonMemory] = useState(256);

	useEffect(() => {
		setPasswordError(null);
	}, [password]);

	const onPressCreate = useCallback(
		async (usePassword = true) => {
			if (isSubmittingRef.current) return;

			if (!vaultName) {
				setVaultNameError(t('creator.errors.nameRequired'));
				vaultNameInputRef.current?.focus();
				return;
			}

			if (usePassword && !password) {
				setPasswordError(t('creator.errors.passwordRequired'));
				passwordInputRef.current?.focus();
				return;
			}

			isSubmittingRef.current = true;
			setIsPending(true);
			setVaultNameError(null);
			setPasswordError(null);

			const response = await onCreateVault({
				name: vaultName,
				encryption: usePassword
					? {
							algorithm,
							password,
							keyDerivation: {
								ops: argonOps,
								memory: argonMemory,
							},
						}
					: null,
			}).finally(() => {
				isSubmittingRef.current = false;
				setIsPending(false);
			});

			if (response !== undefined) {
				setVaultNameError(response);
			} else {
				telemetry.track(TELEMETRY_EVENT_NAME.VAULT_CREATED, {
					encryption: usePassword ? algorithm : 'none',
				});
			}
		},
		[
			vaultName,
			password,
			onCreateVault,
			algorithm,
			argonOps,
			argonMemory,
			t,
			telemetry,
		],
	);

	// Set focus to the input
	useEffect(() => {
		const hasVaultName = vaultNameInputRef.current?.value;
		if (!hasVaultName) {
			vaultNameInputRef.current?.focus();
			return;
		}

		passwordInputRef.current?.focus();
	}, []);

	const noPasswordDialogState = useDisclosure();

	return (
		<VaultsForm
			title={t('creator.title')}
			controls={
				<>
					<Button
						variant="accent"
						w="100%"
						onClick={() => onPressCreate(true)}
						disabled={isPending}
					>
						{t('creator.actions.create')}
					</Button>
					<Button
						w="100%"
						onClick={noPasswordDialogState.onOpen}
						disabled={isPending}
					>
						{t('creator.actions.continueNoPassword')}
					</Button>
					{onCancel && (
						<Button w="100%" onClick={onCancel} disabled={isPending}>
							{t('creator.actions.cancel')}
						</Button>
					)}

					<Dialog.Root
						open={noPasswordDialogState.open}
						placement="center"
						onOpenChange={(e) => {
							if (!e.open) {
								noPasswordDialogState.onClose();
							}
						}}
					>
						<Portal>
							<Dialog.Backdrop />
							<Dialog.Positioner>
								<Dialog.Content>
									<Dialog.Header>
										<Dialog.Title>
											{t('creator.noEncryptionDialog.title')}
										</Dialog.Title>
									</Dialog.Header>
									<Dialog.CloseTrigger asChild>
										<CloseButton size="sm" />
									</Dialog.CloseTrigger>
									<Dialog.Body>
										<Text variant="secondary">
											{t('creator.noEncryptionDialog.description')}
										</Text>
									</Dialog.Body>
									<Dialog.Footer>
										<HStack w="100%" justifyContent="end" asChild>
											<AutoFocusInside>
												<Button
													variant="accent"
													onClick={() => {
														onPressCreate(false);
														noPasswordDialogState.onClose();
													}}
												>
													{t(
														'creator.noEncryptionDialog.actions.confirm',
													)}
												</Button>
												<Button
													onClick={
														noPasswordDialogState.onClose
													}
												>
													{t(
														'creator.noEncryptionDialog.actions.cancel',
													)}
												</Button>
											</AutoFocusInside>
										</HStack>
									</Dialog.Footer>
								</Dialog.Content>
							</Dialog.Positioner>
						</Portal>
					</Dialog.Root>
				</>
			}
		>
			<VStack
				w="100%"
				alignItems="start"
				gap="1.5rem"
				fontSize="18px"
				color="typography.additional"
			>
				<VStack w="100%" alignItems="start" asChild>
					<label>
						<Text>{t('creator.field.name.label')}</Text>
						<InputGroup
							endElementProps={{ paddingInline: 1 }}
							endElement={
								<IconButton
									variant="ghost"
									size="sm"
									icon={<FaDice transform="scale(1.5)" />}
									title={t('creator.field.name.random')}
									onPointerDown={(evt) => {
										evt.preventDefault();
										evt.stopPropagation();
									}}
									onClick={(evt) => {
										evt.preventDefault();

										const suggestedName = shuffleArray(
											Object.values(
												t('creator.field.name.suggests', {
													returnObjects: true,
												}),
											) as string[],
										).find((name) => name !== vaultName);

										if (suggestedName) setVaultName(suggestedName);
										vaultNameInputRef.current?.focus();
									}}
								/>
							}
						>
							<Input
								ref={vaultNameInputRef}
								placeholder={t('creator.field.name.placeholder')}
								value={vaultName}
								onChange={(evt) => setVaultName(evt.target.value)}
								css={{
									'--focus-color': vaultNameError
										? 'red.500'
										: undefined,
								}}
								disabled={isPending}
							/>
						</InputGroup>
						{vaultNameError && <Text variant="error">{vaultNameError}</Text>}
					</label>
				</VStack>

				<VStack w="100%" alignItems="start">
					<HStack>
						<Text>{t('creator.field.password.label')}</Text>
						<Text variant="secondary">
							{t('creator.field.password.recommended')}
						</Text>
					</HStack>

					<Text variant="secondary" fontSize="1rem">
						{t('creator.field.password.description')}
					</Text>

					<PasswordInput
						ref={passwordInputRef}
						placeholder={t('creator.field.password.placeholder')}
						value={password}
						setValue={setPassword}
						invalid={passwordError !== null}
						disabled={isPending}
					/>

					{passwordError && <Text color="red.500">{passwordError}</Text>}
				</VStack>

				<DetailsContainer
					icon={<FaShield />}
					title={t('creator.section.advancedConfig.label')}
				>
					<VStack w="100%" gap="2rem">
						<Text variant="secondary" fontSize="1rem">
							<Trans
								t={t}
								i18nKey="creator.section.advancedConfig.description"
								components={{
									encryption: (
										<Link href="https://deepink.app/reference/encryption/" />
									),
								}}
							/>
						</Text>

						<VStack w="100%" gap="0.5rem">
							<Text fontSize="18px" alignSelf="start">
								{t('creator.field.algorithm.label')}
							</Text>
							<NativeSelect.Root size="md" disabled={isPending}>
								<NativeSelect.Field
									value={algorithm}
									onChange={(evt) =>
										setAlgorithm(
											evt.target.value as ENCRYPTION_ALGORITHM,
										)
									}
								>
									{ENCRYPTION_ALGORITHM_OPTIONS.map((algorithm) => (
										<option key={algorithm} value={algorithm}>
											{algorithm}
										</option>
									))}
								</NativeSelect.Field>
								<NativeSelect.Indicator />
							</NativeSelect.Root>
						</VStack>

						<VStack w="100%" gap="0.5rem" align="start">
							<Text fontSize="18px">{t('creator.section.kdf.label')}</Text>
							<Text variant="secondary" fontSize="1rem">
								{t('creator.section.kdf.description')}
							</Text>

							<VStack
								w="100%"
								gap="1rem"
								align="start"
								borderRadius="6px"
								padding="1rem"
								border="1px solid"
								borderColor="surface.border"
							>
								<VStack w="100%" gap="0.5rem">
									<Text fontSize="18px" alignSelf="start">
										{t('creator.section.kdf.memory.label')}
									</Text>
									<Text variant="secondary" fontSize="1rem">
										{t('creator.section.kdf.memory.description')}
									</Text>

									<RelaxedSlider
										min={128}
										max={1024}
										step={128}
										transformValue={(mb) =>
											bytes(mb * 1024 ** 2) ?? `${mb}mb`
										}
										value={argonMemory}
										onChange={setArgonMemory}
									/>
								</VStack>

								<VStack w="100%" gap="0.5rem">
									<Text fontSize="18px" alignSelf="start">
										{t('creator.section.kdf.ops.label')}
									</Text>
									<Text variant="secondary" fontSize="1rem">
										{t('creator.section.kdf.ops.description')}
									</Text>

									<RelaxedSlider
										min={2}
										max={8}
										step={1}
										value={argonOps}
										onChange={setArgonOps}
									/>
								</VStack>
							</VStack>
						</VStack>
					</VStack>
				</DetailsContainer>
			</VStack>
		</VaultsForm>
	);
};
