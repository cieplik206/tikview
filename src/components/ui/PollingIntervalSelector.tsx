import React from 'react';
import { Clock } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { usePolling } from '../../contexts/PollingContext';

const POLLING_OPTIONS = [
  { value: 1000, label: '1s', description: 'Real-time' },
  { value: 2000, label: '2s', description: 'Fast' },
  { value: 5000, label: '5s', description: 'Normal' },
  { value: 10000, label: '10s', description: 'Slow' },
  { value: 30000, label: '30s', description: 'Very Slow' },
];

export const PollingIntervalSelector: React.FC = () => {
  const { pollingInterval, setPollingInterval } = usePolling();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="btn btn-ghost btn-sm gap-2">
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh:</span>
          <span className="font-mono">
            {POLLING_OPTIONS.find(opt => opt.value === pollingInterval)?.label || '2s'}
          </span>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-[99999] mt-2 w-48 origin-top-right divide-y divide-gray-700 rounded-md bg-base-200 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1">
            <div className="px-2 py-2 text-sm text-gray-400">
              Polling Interval
            </div>
          </div>
          <div className="px-1 py-1">
            {POLLING_OPTIONS.map(option => (
              <Menu.Item key={option.value}>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-primary text-primary-content' : 'text-base-content'
                    } ${
                      pollingInterval === option.value ? 'bg-base-300' : ''
                    } group flex w-full items-center justify-between rounded-md px-2 py-2 text-sm`}
                    onClick={() => setPollingInterval(option.value)}
                  >
                    <span>{option.label}</span>
                    <span className={`text-xs ${active ? 'text-primary-content/70' : 'text-base-content/50'}`}>
                      {option.description}
                    </span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};