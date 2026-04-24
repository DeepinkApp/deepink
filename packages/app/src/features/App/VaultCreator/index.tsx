import React, {
	FC,
	forwardRef,
	PropsWithChildren,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { useTranslation } from 'react-i18next';
import { FaDice, FaShield, FaThumbsDown, FaThumbsUp } from 'react-icons/fa6';
import bytes from 'bytes';
import { LOCALE_NAMESPACE } from 'src/i18n';
import {
	Box,
	Button,
	HStack,
	Input,
	InputGroup,
	InputProps,
	InputRightElement,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Progress,
	Select,
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
	Omit<InputProps, 'value'> & { value: string; setValue: (value: string) => void }
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
			<InputGroup size="md">
				<Input
					ref={ref}
					type="password"
					value={password}
					onChange={(evt) => setPassword(evt.target.value)}
					{...props}
				/>
				{passwordScore && (
					<InputRightElement>
						{passwordScore.strength === 'good' ? (
							<FaThumbsUp />
						) : (
							<FaThumbsDown />
						)}
					</InputRightElement>
				)}
			</InputGroup>

			{passwordScore && (
				<VStack width="100%" align="start" paddingTop=".3rem">
					<Text color="typography.secondary" fontSize="1rem">
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
					<Progress
						width="100%"
						value={passwordScore.entropy}
						max={80}
						size="xs"
						variant={passwordScore.strength === 'good' ? 'success' : 'alert'}
					/>
				</VStack>
			)}
		</VStack>
	);
});

export const DetailsContainer = ({ children }: PropsWithChildren) => {
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
				as="label"
				display="inline-flex"
				gap=".5rem"
				textDecor="none"
				width="100%"
				color="typography.accent"
				alignItems="center"
			>
				<FaShield />
				<span>Advanced encryption options</span>

				<Switch
					marginLeft="auto"
					isChecked={isOpened}
					onChange={(evt) => {
						setIsOpened(evt.target.checked);
					}}
				/>
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

					<Modal
						isOpen={noPasswordDialogState.isOpen}
						onClose={noPasswordDialogState.onClose}
						isCentered
					>
						<ModalOverlay />
						<ModalContent>
							<ModalCloseButton />
							<ModalHeader>
								{t('creator.noEncryptionDialog.title')}
							</ModalHeader>
							<ModalBody>
								<Text color="typography.secondary">
									{t('creator.noEncryptionDialog.description')}
								</Text>
							</ModalBody>
							<ModalFooter>
								<HStack
									w="100%"
									justifyContent="end"
									as={AutoFocusInside}
								>
									<Button
										variant="accent"
										onClick={() => {
											onPressCreate(false);
											noPasswordDialogState.onClose();
										}}
									>
										{t('creator.noEncryptionDialog.actions.confirm')}
									</Button>
									<Button onClick={noPasswordDialogState.onClose}>
										{t('creator.noEncryptionDialog.actions.cancel')}
									</Button>
								</HStack>
							</ModalFooter>
						</ModalContent>
					</Modal>
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
				<VStack as="label" w="100%" alignItems="start">
					<Text>{t('creator.field.name.label')}</Text>

					<InputGroup size="md">
						<Input
							ref={vaultNameInputRef}
							placeholder={t('creator.field.name.placeholder')}
							value={vaultName}
							onChange={(evt) => setVaultName(evt.target.value)}
							focusBorderColor={vaultNameError ? 'red.500' : undefined}
							disabled={isPending}
						/>
						<InputRightElement>
							<IconButton
								variant="ghost"
								icon={<FaDice transform="scale(1.5)" />}
								title={t('creator.field.name.random')}
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
						</InputRightElement>
					</InputGroup>

					{vaultNameError && <Text color="red.500">{vaultNameError}</Text>}
				</VStack>

				<VStack w="100%" alignItems="start">
					<HStack>
						<Text>{t('creator.field.password.label')}</Text>
						<Text variant="secondary">
							{t('creator.field.password.recommended')}
						</Text>
					</HStack>

					<Text color="typography.secondary" fontSize="1rem">
						All data in vault will be encrypted via this password
					</Text>

					<PasswordInput
						ref={passwordInputRef}
						placeholder={t('creator.field.password.placeholder')}
						value={password}
						setValue={setPassword}
						isInvalid={passwordError !== null}
						isDisabled={isPending}
					/>

					{passwordError && <Text color="red.500">{passwordError}</Text>}
				</VStack>

				<DetailsContainer>
					<VStack w="100%" gap="2rem">
						<VStack w="100%" gap="0.5rem">
							<Text fontSize="18px" alignSelf="start">
								{t('creator.field.algorithm.label')}
							</Text>
							<Select
								size="md"
								value={algorithm}
								onChange={(evt) =>
									setAlgorithm(evt.target.value as ENCRYPTION_ALGORITHM)
								}
								disabled={isPending}
							>
								{ENCRYPTION_ALGORITHM_OPTIONS.map((algorithm) => (
									<option key={algorithm} value={algorithm}>
										{algorithm}
									</option>
								))}
							</Select>
						</VStack>

						<VStack w="100%" gap="0.5rem" align="start">
							<Text fontSize="18px">Key derivation function</Text>
							<Text color="typography.secondary" fontSize="1rem">
								Helps protect weak or reused passwords by making each
								guess slower and more costly. Raise these settings for
								stronger protection, or keep the defaults for a balanced
								experience.
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
										Memory usage
									</Text>
									<Text color="typography.secondary" fontSize="1rem">
										Makes each password guess use more memory. This is
										especially effective against large-scale attacks,
										because memory is costly and harder to scale
										efficiently than raw computation.
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
										Iterations
									</Text>
									<Text color="typography.secondary" fontSize="1rem">
										Repeats the derivation work for each password
										guess. This increases the cost of every guess in a
										mostly linear way: doubling iterations roughly
										doubles the work for both attackers and your
										device.
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
