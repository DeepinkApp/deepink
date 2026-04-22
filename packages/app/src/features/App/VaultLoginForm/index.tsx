import React, { FC, useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Button, Input, useToast, VStack } from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { VaultSummary } from '@core/storage/VaultsList';
import { useTelemetryTracker } from '@features/telemetry';
import { useFocusableRef } from '@hooks/useFocusableRef';

import { OnPickVault } from '../types';
import { VaultsForm } from '../VaultsForm';

export type VaultLoginFormProps = {
	vault: VaultSummary;
	onLogin: OnPickVault;
	onPickAnotherVault: () => void;
};

export const VaultLoginForm: FC<VaultLoginFormProps> = ({
	vault,
	onLogin,
	onPickAnotherVault,
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.vault);
	const telemetry = useTelemetryTracker();

	const toast = useToast();
	const toastId = 'vault-login' + useId();
	useEffect(
		() => () => {
			toast.close(toastId);
		},
		[toast, toastId],
	);

	const [secret, setSecret] = useState('');
	const [isPending, setIsPending] = useState(false);

	const [errorMessage, setErrorMessage] = useState<null | string>(null);
	useEffect(() => {
		setErrorMessage(null);
	}, [secret]);

	const onPressLogin = useCallback(async () => {
		setErrorMessage(null);
		setIsPending(true);

		const response = await onLogin(vault, secret || undefined).finally(() => {
			setIsPending(false);
		});

		if (response.status === 'error') {
			setErrorMessage(response.message ?? t('login.errors.cannotOpen'));

			toast.close(toastId);
			requestAnimationFrame(() => {
				toast({
					id: toastId,
					status: 'error',
					title: t('login.errors.cannotOpen'),
					description: response.message,
				});
			});
		}

		telemetry.track(TELEMETRY_EVENT_NAME.VAULT_OPEN, {
			status: response.status === 'error' ? 'error' : 'ok',
		});
	}, [onLogin, vault, secret, t, telemetry, toast, toastId]);

	const firstInputRef = useFocusableRef<HTMLInputElement>();
	useEffect(() => {
		if (isPending || !firstInputRef.current) return;

		firstInputRef.current.focus();
	}, [firstInputRef, isPending]);

	return (
		<VaultsForm
			title={t('login.title')}
			controls={
				<>
					<Button
						variant="accent"
						w="100%"
						onClick={onPressLogin}
						disabled={isPending}
					>
						{t('login.actions.unlock')}
					</Button>
					<Button w="100%" onClick={onPickAnotherVault}>
						{t('login.actions.changeVault')}
					</Button>
				</>
			}
		>
			<VStack as="form" w="100%" alignItems="start" onSubmit={onPressLogin}>
				<Input
					ref={firstInputRef}
					size="lg"
					type="password"
					placeholder={t('login.field.password.placeholder')}
					value={secret}
					onChange={(evt) => setSecret(evt.target.value)}
					focusBorderColor={errorMessage ? 'red.500' : undefined}
					disabled={isPending}
				/>
			</VStack>
		</VaultsForm>
	);
};
