import AvailabilityToday from '@/Components/home/AvailabilityToday';
import CourtsShowcase from '@/Components/home/CourtsShowcase';
import FaqSection from '@/Components/home/FaqSection';
import FinalCta from '@/Components/home/FinalCta';
import Hero from '@/Components/home/Hero';
import HowItWorks from '@/Components/home/HowItWorks';
import MarqueeStrip from '@/Components/home/MarqueeStrip';
import MemberBenefits from '@/Components/home/MemberBenefits';
import PricingPreview from '@/Components/home/PricingPreview';
import Testimonials from '@/Components/home/Testimonials';
import WhyPbs from '@/Components/home/WhyPbs';
import PublicLayout from '@/Layouts/PublicLayout';
import { Head } from '@inertiajs/react';

export default function Home({ canRegister, venue, hero, courts, pricing, stats, dpPercentage, faqs, testimonials }) {
    return (
        <PublicLayout venue={venue}>
            <Head title="Booking Lapangan Padel Online">
                <meta name="description" content={hero?.subheadline} />
            </Head>

            <Hero hero={hero} pricing={pricing} stats={stats} dpPercentage={dpPercentage} />
            <AvailabilityToday courts={courts} />
            <MarqueeStrip />
            <WhyPbs stats={stats} />
            <CourtsShowcase courts={courts} />
            <HowItWorks dpPercentage={dpPercentage} />
            <PricingPreview pricing={pricing} stats={stats} dpPercentage={dpPercentage} />
            <MemberBenefits dpPercentage={dpPercentage} canRegister={canRegister} />
            <Testimonials testimonials={testimonials} />
            <FaqSection faqs={faqs} whatsapp={venue.whatsapp} />
            <FinalCta />
        </PublicLayout>
    );
}
