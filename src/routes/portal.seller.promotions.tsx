import { createFileRoute } from '@tanstack/react-router';
import { PromotionParticipationPage } from '@/components/portal/PromotionParticipationPage';
export const Route = createFileRoute('/portal/seller/promotions')({ component: () => <PromotionParticipationPage /> });
