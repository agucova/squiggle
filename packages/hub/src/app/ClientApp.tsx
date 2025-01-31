"use client";

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { FC, PropsWithChildren } from "react";
import { RelayEnvironmentProvider } from "react-relay";

import { RootLayout } from "@/components/layout/RootLayout";
import { getCurrentEnvironment } from "@/relay/environment";
import { WithToasts } from "@quri/ui";

export const ClientApp: FC<PropsWithChildren<{ session: Session | null }>> = ({
  session,
  children,
}) => {
  const environment = getCurrentEnvironment();

  return (
    <SessionProvider session={session}>
      <RelayEnvironmentProvider environment={environment}>
        <WithToasts>
          <RootLayout>{children}</RootLayout>
        </WithToasts>
      </RelayEnvironmentProvider>
    </SessionProvider>
  );
};
