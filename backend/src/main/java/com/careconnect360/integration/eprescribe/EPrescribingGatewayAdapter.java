package com.careconnect360.integration.eprescribe;

import com.careconnect360.entity.Prescription;

public interface EPrescribingGatewayAdapter {
    EPrescribingDispatchResponse dispatchPrescription(Prescription prescription);
    EPrescribingStatusResponse checkStatus(String transmissionId);
    String getGatewayName();
    boolean isLiveGateway();
}
