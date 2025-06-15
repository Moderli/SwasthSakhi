import Image from "next/image";
import Header from '@/components/Header';
import HeroButtons from '@/components/HeroButtons';
import {
  ChatBubbleLeftRightIcon,
  UsersIcon,
  LockClosedIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="bg-white">
      <Header />

      <main>
        {/* Hero Section */}
        <div className="relative isolate overflow-hidden bg-gradient-to-b from-teal-100/20 pt-14">
           <div
            className="absolute inset-y-0 right-1/2 -z-10 -mr-96 w-[200%] origin-top-right skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-20 lg:mr-0 xl:mr-16 xl:origin-center"
            aria-hidden="true"
          />
          <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-28">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
              <div className="flex">
                <div className="relative flex items-center gap-x-4 rounded-full px-4 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
                  <span className="font-semibold text-indigo-600">SwasthyaSakhi</span>
                  <span className="h-4 w-px bg-gray-900/10" aria-hidden="true" />
                  <a href="#" className="flex items-center gap-x-1">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Coming Soon
                  </a>
                </div>
              </div>
              <h1 className="mt-10 max-w-lg text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Private, Safe Healthcare for Rural Women
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Connecting women in villages with trusted female doctors. Get confidential health support in your own language, right from your phone.
              </p>
              <HeroButtons />
            </div>
            <div className="mt-16 sm:mt-24 lg:mt-0 lg:flex-shrink-0 lg:flex-grow">
              <Image
                src="/logo.png"
                alt="SwasthyaSakhi Logo"
                width={500}
                height={500}
                className="mx-auto drop-shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-teal-600">Your Health, Your Privacy</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need for better health
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                SwasthyaSakhi provides a safe space for women to address their health concerns with dignity and confidence.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {features.map((feature) => (
                  <div key={feature.name} className="relative pl-16">
                    <dt className="text-base font-semibold leading-7 text-gray-900">
                      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500 from-teal-500 to-indigo-600 shadow-lg backdrop-blur-sm ring-1 ring-white/20">
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Impact Section */}
        <div id="impact" className="bg-white py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                    <div className="lg:pr-8 lg:pt-4">
                        <div className="lg:max-w-lg">
                            <h2 className="text-base font-semibold leading-7 text-teal-600">Our Impact</h2>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">A healthier future for every woman</p>
                            <p className="mt-6 text-lg leading-8 text-gray-600">
                                By providing timely access to healthcare, we empower women to take control of their health, leading to stronger families and communities.
                            </p>
                            <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-gray-600 lg:max-w-none">
                                {impacts.map((impact) => (
                                <div key={impact.name} className="relative pl-9">
                                    <dt className="inline font-semibold text-gray-900">
                                    <impact.icon className="absolute left-1 top-1 h-5 w-5 text-teal-600" aria-hidden="true" />
                                    {impact.name}
                                    </dt>
                                    <dd className="inline">{' '}{impact.description}</dd>
                                </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>


      </main>

      {/* Footer */}
      <footer className="bg-white" aria-labelledby="footer-heading">
        <h2 id="footer-heading" className="sr-only">Footer</h2>
        <div className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
          <div className="border-t border-gray-900/10 pt-8 md:flex md:items-center md:justify-between">
            <p className="mt-8 text-xs leading-5 text-gray-500 md:order-1 md:mt-0">
              &copy; {new Date().getFullYear()} SwasthyaSakhi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    name: 'Talk to a Female Doctor',
    description: 'Connect with certified female doctors via chat, call, or video. Special focus on gynecology and pregnancy in regional languages.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'CHW Integration',
    description: 'Community Health Workers can use the app to help women in the village, creating health profiles for those without smartphones.',
    icon: UsersIcon,
  },
  {
    name: 'Anonymous Mode',
    description: 'Ask sensitive health questions without revealing your identity, ensuring your privacy is always protected.',
    icon: LockClosedIcon,
  },
  {
    name: 'Digital Health Card',
    description: 'A simple digital report of your health history, accessible offline and easily shareable with hospitals when needed.',
    icon: DocumentTextIcon,
  },
];

const impacts = [
    {
      name: 'Early Diagnosis.',
      description: 'Encourage early diagnosis of health issues, reducing risks and improving outcomes.',
      icon: CheckCircleIcon,
    },
    {
      name: 'Builds Trust.',
      description: 'Create a trusted and safe environment for women to discuss health issues openly.',
      icon: CheckCircleIcon,
    },
    {
      name: 'Reduces Taboos.',
      description: 'Break down cultural barriers and stigma around female health topics.',
      icon: CheckCircleIcon,
    },
]
