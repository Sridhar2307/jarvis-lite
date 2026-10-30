import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    let adAccount = await prisma.adAccount.findFirst({
      where: { organizationId: auth.organization.id },
      include: {
        campaigns: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!adAccount) {
      adAccount = await prisma.adAccount.create({
        data: {
          organizationId: auth.organization.id,
          accountName: "Meta Ads Primary",
          platform: "META",
          status: "DISCONNECTED",
        },
        include: {
          campaigns: true,
        },
      });
    }

    const campaigns = adAccount.campaigns;
    const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
    const avgCtr = campaigns.length > 0 ? campaigns.reduce((acc, c) => acc + c.ctr, 0) / campaigns.length : 0;
    const blendedRoas = campaigns.length > 0 ? campaigns.reduce((acc, c) => acc + c.roas, 0) / campaigns.length : 0;

    return apiSuccess({
      account: {
        id: adAccount.id,
        name: adAccount.accountName,
        status: adAccount.status,
        totalSpend: adAccount.totalSpend > 0 ? adAccount.totalSpend : totalSpend,
        avgCtr: adAccount.avgCtr > 0 ? adAccount.avgCtr : avgCtr,
        blendedRoas: adAccount.blendedRoas > 0 ? adAccount.blendedRoas : blendedRoas,
      },
      campaigns,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

