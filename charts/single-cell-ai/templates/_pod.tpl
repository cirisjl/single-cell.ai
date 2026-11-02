{{- define "single-cell-ai.pod" -}}
{{- $root := .root -}}
{{- $name := .name -}}
{{- $w := .workload -}}
metadata:
  labels:
{{ include "single-cell-ai.selectorLabels" (dict "root" $root "component" $name) | nindent 4 }}
  annotations:
    checksum/config: {{ toYaml $root.Values.config.data | sha256sum | quote }}
spec:
  {{- with $root.Values.global.imagePullSecrets }}
  imagePullSecrets:
{{ toYaml . | nindent 4 }}
  {{- end }}
  {{- with $root.Values.global.podSecurityContext }}
  securityContext:
{{ toYaml . | nindent 4 }}
  {{- end }}
  {{- with (default $root.Values.global.nodeSelector $w.nodeSelector) }}
  nodeSelector:
{{ toYaml . | nindent 4 }}
  {{- end }}
  {{- with (default $root.Values.global.tolerations $w.tolerations) }}
  tolerations:
{{ toYaml . | nindent 4 }}
  {{- end }}
  {{- with (default $root.Values.global.affinity $w.affinity) }}
  affinity:
{{ toYaml . | nindent 4 }}
  {{- end }}
  terminationGracePeriodSeconds: {{ $w.terminationGracePeriodSeconds | default 30 }}
  containers:
    - name: {{ $name }}
      image: {{ $w.image | quote }}
      imagePullPolicy: {{ $w.imagePullPolicy | default "IfNotPresent" }}
      {{- with $w.containerPorts }}
      ports:
{{ toYaml . | nindent 8 }}
      {{- end }}
      {{- with $w.command }}
      command:
{{ toYaml . | nindent 8 }}
      {{- end }}
      {{- with $w.args }}
      args:
{{ toYaml . | nindent 8 }}
      {{- end }}
      {{- if and $w.envFromConfig $root.Values.config.enabled }}
      envFrom:
        - configMapRef:
            name: {{ $root.Values.config.name }}
      {{- end }}
      {{- with $w.env }}
      env:
        {{- range . }}
        - name: {{ .name }}
          {{- if .secretKey }}
          valueFrom:
            secretKeyRef:
              name: {{ $root.Values.secrets.existingSecret }}
              key: {{ .secretKey }}
          {{- else if hasKey . "value" }}
          value: {{ .value | quote }}
          {{- end }}
        {{- end }}
      {{- end }}
      {{- with $w.resources }}
      resources:
{{ toYaml . | nindent 8 }}
      {{- end }}
      {{- with $w.readinessProbe }}
      readinessProbe:
{{ toYaml . | nindent 8 }}
      {{- end }}
      {{- with $w.livenessProbe }}
      livenessProbe:
{{ toYaml . | nindent 8 }}
      {{- end }}
      {{- with $w.startupProbe }}
      startupProbe:
{{ toYaml . | nindent 8 }}
      {{- end }}
      {{- with $w.volumeMounts }}
      volumeMounts:
{{ toYaml . | nindent 8 }}
      {{- end }}
  {{- with $w.volumes }}
  volumes:
    {{- range . }}
    - name: {{ .name }}
      {{- if eq .type "secret" }}
      secret:
        secretName: {{ $root.Values.secrets.existingSecret }}
        items:
          {{- range .keys }}
          - key: {{ . }}
            path: {{ . }}
          {{- end }}
      {{- else if eq .type "pvc" }}
      persistentVolumeClaim:
        {{- if eq .claim "shared" }}
        claimName: {{ $root.Values.storage.shared.name }}
        {{- else if eq .claim "directus" }}
        claimName: {{ $root.Values.storage.directus.name }}
        {{- else }}
        {{ fail (printf "unknown PVC claim type: %s" .claim) }}
        {{- end }}
      {{- else }}
      {{ fail (printf "unknown volume type: %s" .type) }}
      {{- end }}
    {{- end }}
  {{- end }}
{{- end -}}
